const mongoose = require('mongoose');
const axios = require('axios');
const { checkRedisConnection } = require('../config/redis');
const emailService = require('../services/emailService');
const config = require('../config/env');

/**
 * Health check endpoint: GET /health and GET /api/health
 */
const getHealthStatus = async (req, res) => {
  const startTime = Date.now();

  // 1. MongoDB Health
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  // 2. Redis Health
  const redisHealthy = await checkRedisConnection();
  const redisStatus = redisHealthy ? 'connected' : 'disconnected';

  // 3. SMTP Health
  const smtpStatus = emailService.transporter ? 'ready' : 'fallback';

  // 4. n8n Engine Health (non-blocking ping with 1.5s timeout)
  let n8nStatus = 'unknown';
  try {
    const n8nRes = await axios.get(`${config.n8nBaseUrl}/healthz`, { timeout: 1500 });
    n8nStatus = n8nRes.status === 200 ? 'online' : 'reachable';
  } catch (err) {
    n8nStatus = 'offline_or_direct_fallback';
  }

  const overallStatus = (mongoStatus === 'connected' && redisHealthy) ? 'healthy' : 'degraded';
  const durationMs = Date.now() - startTime;

  res.status(overallStatus === 'healthy' ? 200 : 207).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: durationMs,
    services: {
      node: {
        status: 'online',
        version: process.version,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      mongodb: {
        status: mongoStatus
      },
      redis: {
        status: redisStatus
      },
      worker: {
        status: 'ready'
      },
      smtp: {
        status: smtpStatus,
        host: config.smtpHost,
        port: config.smtpPort
      },
      n8n: {
        status: n8nStatus
      }
    }
  });
};

module.exports = { getHealthStatus };
