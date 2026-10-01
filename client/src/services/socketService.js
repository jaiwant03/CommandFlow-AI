import { io } from 'socket.io-client';
import { getCurrentUser } from './authService';
import { SERVER_BASE_URL } from './api';

const SOCKET_SERVER_URL = SERVER_BASE_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to CommandFlow real-time server:', this.socket.id);
      const user = getCurrentUser();
      if (user && user._id) {
        this.socket.emit('join_user', user._id);
      }
    });

    this.socket.on('automation_status', (data) => {
      console.log('[SocketService] Real-time status event:', data.automationId, data.status);
      this.listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error('[SocketService Listener Error]:', e);
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });

    return this.socket;
  }

  subscribeStatus(callback) {
    this.listeners.add(callback);
    if (!this.socket) {
      this.connect();
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  joinAutomation(automationId) {
    if (this.socket && automationId) {
      this.socket.emit('join_automation', automationId);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
