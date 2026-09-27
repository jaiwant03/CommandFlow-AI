const http = require('http');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socketManager');
const { initWorker } = require('./workers/commandWorker');
const { initScheduler } = require('./services/schedulerService');

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initSocket(server);

// Initialize Database, Worker & Scheduler
const startServer = async () => {
  try {
    await connectDB();
    initWorker();
    initScheduler();

    const PORT = config.port;

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`[CommandFlow AI] Modular Monolith Server Online`);
      console.log(`[CommandFlow AI] URL: http://localhost:${PORT}`);
      console.log(`[CommandFlow AI] Realtime: Socket.IO initialized`);
      console.log(`[CommandFlow AI] Queue: BullMQ commandQueue active`);
      console.log(`[CommandFlow AI] Environment: ${config.env}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[CommandFlow AI] Startup Error:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[CommandFlow AI Server] SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('[CommandFlow AI Server] Process terminated.');
  });
});

module.exports = server;
