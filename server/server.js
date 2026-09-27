const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initScheduler } = require('./services/schedulerService');

// Initialize Database & Background Services
connectDB();
initScheduler();

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[CommandFlow AI Server] Running on http://localhost:${PORT}`);
  console.log(`[CommandFlow AI Server] Environment: ${config.env}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[CommandFlow AI Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[CommandFlow AI Server] Process terminated.');
  });
});

module.exports = server;
