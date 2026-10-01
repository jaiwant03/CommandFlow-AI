import { io } from 'socket.io-client';
import { getCurrentUser } from './authService';
import { SERVER_BASE_URL } from './api';

const SOCKET_SERVER_URL = SERVER_BASE_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.connectionListeners = new Set();
    this.isReconnecting = false;

    // Auto-reconnect when app returns from background / sleep / network restore
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.ensureConnected();
        }
      });

      window.addEventListener('online', () => {
        this.ensureConnected();
      });
    }
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      this.isReconnecting = false;
      this.notifyConnectionState(true);
      const user = getCurrentUser();
      if (user && user._id) {
        this.socket.emit('join_user', user._id);
      }
    });

    this.socket.on('automation_status', (data) => {
      this.listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (e) {
          console.error('[SocketService Listener Error]:', e);
        }
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.notifyConnectionState(false, reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // the server forcefully disconnected or network dropped, retry
        setTimeout(() => this.ensureConnected(), 2000);
      }
    });

    this.socket.on('connect_error', (err) => {
      this.notifyConnectionState(false, err.message);
    });

    return this.socket;
  }

  ensureConnected() {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
  }

  notifyConnectionState(isConnected, error = null) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener({ isConnected, error });
      } catch (e) {}
    });
  }

  subscribeConnection(callback) {
    this.connectionListeners.add(callback);
    if (this.socket) {
      callback({ isConnected: this.socket.connected });
    }
    return () => {
      this.connectionListeners.delete(callback);
    };
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
