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
  lazyConnect: true,          // Do not crash if Redis is starting up
  retryStrategy: (times) => {
    // Reconnect with exponential backoff up to 3 seconds
    const delay = Math.min(times * 200, 3000);
    return delay;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url || redisOptions);

    redisClient.on('connect', () => {
      isConnected = true;
      console.log(`[Redis] Connected to Redis at ${config.redis.host}:${config.redis.port}`);
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Log connection error without spamming or crashing
      if (err.code === 'ECONNREFUSED') {
        // Suppress noisy trace, single line warning
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
  const client = getRedisClient();
  try {
    if (!isConnected) {
      await client.connect();
    }
    const ping = await client.ping();
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
