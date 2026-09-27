const { Server } = require('socket.io');
const config = require('../config/env');

let io = null;

const initSocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user room for targeted updates
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join specific automation room
    socket.on('join_automation', (automationId) => {
      if (automationId) {
        socket.join(`automation_${automationId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => io;

/**
 * Broadcast status update for an automation
 */
const emitStatusUpdate = (automationId, data) => {
  if (!io) return;
  const payload = {
    automationId,
    timestamp: new Date().toISOString(),
    ...data
  };

  // Broadcast to specific automation room and globally
  io.to(`automation_${automationId}`).emit('automation_status', payload);
  if (data.userId) {
    io.to(`user_${data.userId}`).emit('automation_status', payload);
  }
  io.emit('automation_status', payload);
};

module.exports = {
  initSocket,
  getIO,
  emitStatusUpdate
};
