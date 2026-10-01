import axios from 'axios';

// Ensure production/mobile builds NEVER fallback to localhost
const PRODUCTION_API_URL = 'https://commandflow-ai.onrender.com';
export const SERVER_BASE_URL = (
  import.meta.env.VITE_API_URL || PRODUCTION_API_URL
).replace(/\/+$/, '');

// Network status listeners for Render sleep / cold-start awareness
const networkListeners = new Set();
export const subscribeNetworkStatus = (listener) => {
  networkListeners.add(listener);
  return () => networkListeners.delete(listener);
};

const notifyNetworkStatus = (status) => {
  networkListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.warn('[NetworkStatus Listener Error]:', e);
    }
  });
};

const API = axios.create({
  baseURL: `${SERVER_BASE_URL}/api`,
  timeout: 60000, // 60s timeout to gracefully allow Render free tier wakeups
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token and handle FormData boundary
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('commandflow_user') || 'null');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    // Remove default Content-Type if payload is FormData so boundary is generated automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token expiration and Render cold-start handling
API.interceptors.response.use(
  (response) => {
    // Report server is active
    notifyNetworkStatus({ isOnline: true, isWaking: false });
    return response;
  },
  (error) => {
    if (error.response) {
      // 401 Unauthorized: Session token expired
      if (error.response.status === 401) {
        localStorage.removeItem('commandflow_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
          window.location.href = '/login';
        }
      }
      // 502 / 503 / 504: Render waking up or proxy timeout
      if ([502, 503, 504].includes(error.response.status)) {
        notifyNetworkStatus({
          isOnline: false,
          isWaking: true,
          message: 'CommandFlow AI Server is waking up on Render. Please wait a moment...'
        });
      }
    } else if (error.code === 'ERR_NETWORK' || !navigator.onLine) {
      // Network disconnected or backend server cold-starting
      notifyNetworkStatus({
        isOnline: false,
        isWaking: true,
        message: 'Connecting to CommandFlow AI Server... It may take up to 30s to spin up.'
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Health check helper to ping the Render backend on app start
 */
export const checkServerHealth = async () => {
  try {
    const res = await axios.get(`${SERVER_BASE_URL}/health`, { timeout: 15000 });
    notifyNetworkStatus({ isOnline: true, isWaking: false });
    return res.data;
  } catch (err) {
    notifyNetworkStatus({
      isOnline: false,
      isWaking: true,
      message: 'Server is starting up on Render...'
    });
    return null;
  }
};

export default API;
