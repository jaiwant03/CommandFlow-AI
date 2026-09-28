const Redis = require('ioredis');
const config = require('./env');

let redisClient = null;
let isConnected = false;

const redisOptions = {
  host: config.redis.host || '127.0.0.1',
  port: config.redis.port || 6379,
  password: config.redis.password,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,    // Required by BullMQ
  retryStrategy: (times) => {
    // Reconnect with exponential backoff up to 3 seconds
    const delay = Math.min(times * 200, 3000);
    return delay;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      ...redisOptions,
      ...(config.redis.url ? { path: undefined } : {})
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log(`[Redis] Connected to Redis at ${config.redis.host}:${config.redis.port}`);
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      if (err.code === 'ECONNREFUSED') {
        // Suppress noisy trace
      } else {
        console.warn(`[Redis Notice]: ${err.message}`);
      }
    });

    redisClient.on('close', () => {
      isConnected = false;
    });
  }

  return redisClient;
};

const isRedisAvailable = () => isConnected;

const checkRedisConnection = async () => {
  if (!isConnected && (!redisClient || redisClient.status !== 'ready')) {
    return false;
  }
  try {
    const client = getRedisClient();
    const pingPromise = client.ping();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout')), 800)
    );
    const ping = await Promise.race([pingPromise, timeoutPromise]);
    isConnected = ping === 'PONG';
    return isConnected;
  } catch (error) {
    isConnected = false;
    return false;
  }
};

module.exports = {
  getRedisClient,
  isRedisAvailable,
  checkRedisConnection,
  redisOptions
};
