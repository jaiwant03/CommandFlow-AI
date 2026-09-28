const { Queue } = require('bullmq');
const { redisOptions, getRedisClient, isRedisAvailable, checkRedisConnection } = require('../config/redis');

let commandQueue = null;

const getCommandQueue = () => {
  if (!commandQueue) {
    commandQueue = new Queue('commandQueue', {
      connection: redisOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000 // 2s, 4s, 8s
        },
        removeOnComplete: {
          count: 500
        },
        removeOnFail: {
          count: 1000
        }
      }
    });

    commandQueue.on('error', (err) => {
      // Suppress connection spam
    });
  }

  return commandQueue;
};

/**
 * Add a command job to BullMQ queue
 */
const addCommandJob = async ({ automationId, userId, command, inputType = 'text', plan, idempotencyKey, delayMs = 0 }) => {
  const jobData = {
    automationId,
    userId: userId ? userId.toString() : null,
    command,
    inputType,
    plan,
    idempotencyKey,
    createdAt: new Date().toISOString()
  };

  const jobOptions = {
    jobId: `cmd-${automationId}`,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  };

  if (delayMs > 0) {
    jobOptions.delay = delayMs;
  }

  // 1. Pre-check Redis availability to avoid offline buffering delays
  const isHealthy = await checkRedisConnection();
  if (!isHealthy) {
    console.warn(`[BullMQ Notice]: Redis is not connected. Triggering resilient in-process execution for ${automationId}...`);
    return {
      success: false,
      fallbackRequired: true,
      error: 'Redis offline'
    };
  }

  try {
    const queue = getCommandQueue();
    // Add job with a 2.5s safety timeout
    const addPromise = queue.add('processCommand', jobData, jobOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('BullMQ queue.add timeout')), 2500)
    );

    const job = await Promise.race([addPromise, timeoutPromise]);
    console.log(`[BullMQ] Added job ${job.id} for automation ${automationId} (delay: ${delayMs}ms)`);
    return {
      success: true,
      jobId: job.id,
      status: delayMs > 0 ? 'SCHEDULED' : 'QUEUED'
    };
  } catch (err) {
    console.warn(`[BullMQ Notice]: Redis queue temporarily unavailable (${err.message}). Using resilient direct fallback execution.`);
    return {
      success: false,
      fallbackRequired: true,
      error: err.message
    };
  }
};

module.exports = {
  getCommandQueue,
  addCommandJob
};
