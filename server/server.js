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

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { checkRedisConnection } = require('./config/redis');

// Auto-start Redis server on Windows if installed and not already running
const ensureRedis = async () => {
  try {
    const isHealthy = await checkRedisConnection();
    if (isHealthy) return;

    const wingetRedisPath = path.join(
      process.env.LOCALAPPDATA || '',
      'Microsoft/WinGet/Packages/taizod1024.redis-windows-fork_Microsoft.Winget.Source_8wekyb3d8bbwe/Redis-8.10.1-Windows-x64-msys2/redis-server.exe'
    );

    const redisBin = fs.existsSync(wingetRedisPath) ? wingetRedisPath : 'redis-server';
    const child = spawn(redisBin, ['--daemonize', 'no'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    console.log('[Redis Auto-Start] Spawned redis-server process.');
    await new Promise(r => setTimeout(r, 1200));
  } catch (err) {
    console.warn('[Redis Auto-Start Notice]: Running in direct fallback mode.');
  }
};

// Initialize Database, Worker & Scheduler
const startServer = async () => {
  try {
    await connectDB();
    await ensureRedis();
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
