const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initScheduler } = require('./services/schedulerService');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const automationRoutes = require('./routes/automationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const n8nRoutes = require('./routes/n8nRoutes');

// Initialize App & Database
const app = express();
connectDB();
initScheduler();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to API routes
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'CommandFlow AI Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/n8n', n8nRoutes);

// Favicon Handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[CommandFlow AI Server] Running on http://localhost:${PORT}`);
});
