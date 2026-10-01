import axios from 'axios';

export const SERVER_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const API = axios.create({
  baseURL: `${SERVER_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token and handle FormData boundary
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('commandflow_user') || 'null');
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  // Remove default Content-Type if payload is FormData so boundary is generated automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
