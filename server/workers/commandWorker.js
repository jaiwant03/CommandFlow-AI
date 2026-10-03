const dns = require('dns');
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

require('../config/env');
const { Worker } = require('bullmq');
const { redisOptions } = require('../config/redis');
const connectDB = require('../config/db');
const {
  executeAutomation,
  startExecution,
  endExecution,
  isExecutingOther
} = require('../services/executionManager');

let workerInstance = null;

/**
 * BullMQ Job Processor
 * Picks up jobs that were queued in BullMQ when multiple commands were submitted.
 * Executes sequentially (concurrency: 1) and waits if an active command is in flight.
 */
const processJob = async (job) => {
  const { automationId } = job.data;
  console.log(`[CommandWorker] Received queued job ${job.id} for automation ${automationId} (attempt: ${job.attemptsMade + 1})`);

  // Wait if another command is currently executing
  while (isExecutingOther(automationId)) {
    console.log(`[CommandWorker] Active command in progress. Queued job ${job.id} (${automationId}) waiting for turn...`);
    await new Promise(r => setTimeout(r, 200));
  }

  startExecution(automationId);
  try {
    return await executeAutomation(job.data, {
      jobId: job.id,
      attemptsMade: job.attemptsMade,
      isImmediate: false
    });
  } finally {
    endExecution(automationId);
  }
};

/**
 * Initialize and start the BullMQ worker with sequential concurrency (1 job at a time)
 */
const initWorker = () => {
  if (workerInstance) return workerInstance;

  try {
    workerInstance = new Worker('commandQueue', processJob, {
      connection: redisOptions,
      concurrency: 1, // Process queued commands sequentially one by one
      limiter: {
        max: 20,
        duration: 1000 // Rate limit: max 20 jobs/sec
      }
    });

    workerInstance.on('completed', (job) => {
      console.log(`[CommandWorker] Queued job ${job.id} completed.`);
    });

    workerInstance.on('failed', (job, err) => {
      console.warn(`[CommandWorker] Queued job ${job?.id} failed: ${err.message}`);
    });

    workerInstance.on('error', (err) => {
      // Suppress connection spam
    });

    console.log('[CommandWorker] Worker initialized and listening on commandQueue (concurrency: 1).');
    return workerInstance;
  } catch (err) {
    console.warn(`[CommandWorker Notice]: Could not start BullMQ worker (${err.message}). Using resilient fallback.`);
    return null;
  }
};

// Standalone execution support: node server/workers/commandWorker.js
if (require.main === module) {
  connectDB().then(() => {
    initWorker();
    console.log('[CommandWorker] Running as standalone worker process.');
  });
}

module.exports = {
  initWorker,
  processJob,
  executeAutomation
};
