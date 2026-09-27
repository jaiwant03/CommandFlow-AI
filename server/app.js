const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

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

// Global Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Health Check Endpoints (both /health and /api/health)
const healthHandler = (req, res) => {
  res.json({
    status: 'online',
    system: 'CommandFlow AI Modular Monolith',
    timestamp: new Date().toISOString(),
    environment: config.env
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Favicon Handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/automations', automationRoutes);
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
