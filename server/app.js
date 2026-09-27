const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { getHealthStatus } = require('./controllers/healthController');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const automationRoutes = require('./routes/automationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const n8nRoutes = require('./routes/n8nRoutes');
const contactRoutes = require('./routes/contactRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: config.clientUrl || 'http://localhost:5173',
  credentials: true
}));

// Body Parsing with size limits
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health Check Endpoints
app.get('/health', getHealthStatus);
app.get('/api/health', getHealthStatus);

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Favicon Handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/commands', automationRoutes); // Alias for clean API contract
app.use('/api/ai', aiRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/documents', documentRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
