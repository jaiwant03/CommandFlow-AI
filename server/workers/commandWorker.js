const dns = require('dns');
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

require('../config/env');
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { redisOptions } = require('../config/redis');
const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const n8nService = require('../services/n8nService');
const { emitStatusUpdate } = require('../sockets/socketManager');
const connectDB = require('../config/db');

let workerInstance = null;

const processJob = async (job) => {
  const { automationId, userId, command, inputType, plan, idempotencyKey } = job.data;
  const executionId = `EXEC-${automationId}-${Date.now()}`;

  console.log(`[CommandWorker] Processing job ${job.id} for automation ${automationId} (attempt: ${job.attemptsMade + 1})`);

  // 1. Load automation record
  let automation = await Automation.findOne({ automationId });
  if (!automation) {
    console.error(`[CommandWorker] Automation record ${automationId} not found in database.`);
    throw new Error(`Automation record ${automationId} not found.`);
  }

  // 2. IDEMPOTENCY CHECK - Prevent duplicate sends
  if (automation.status === 'SUCCESS' || automation.status === 'SENT') {
    console.log(`[CommandWorker] Idempotency guard: ${automationId} already succeeded with status '${automation.status}'. Skipping.`);
    emitStatusUpdate(automationId, {
      userId,
      status: 'SUCCESS',
      message: 'Command already completed successfully.'
    });
    return { alreadyCompleted: true, status: automation.status };
  }

  // 3. Mark as PROCESSING & notify UI
  automation.status = 'PROCESSING';
  automation.executionId = executionId;
  automation.jobId = job.id;
  automation.attempts = job.attemptsMade + 1;
  await automation.save();

  emitStatusUpdate(automationId, {
    userId,
    status: 'PROCESSING',
    step: 'worker_processing',
    message: 'Worker processing command pipeline...',
    attempts: automation.attempts
  });

  await ActivityLog.create({
    userId,
    automationId,
    executionId,
    jobId: job.id,
    action: `COMMAND_PROCESSING_${automation.channel.toUpperCase()}`,
    channel: automation.channel,
    status: 'PROCESSING',
    message: `Worker picked up job ${job.id} (attempt ${automation.attempts})`
  });

  // 4. Update status to SENDING
  emitStatusUpdate(automationId, {
    userId,
    status: 'SENDING',
    step: 'dispatching',
    message: `Dispatching payload to ${automation.channel === 'gmail' ? 'Gmail SMTP' : 'Telegram Bot'} engine...`
  });

  // 5. Execute via n8n / SMTP / Telegram
  const payload = {
    automationId,
    userCommand: command,
    userId: userId ? userId.toString() : '',
    intent: automation.intent,
    channel: automation.channel,
    recipient: automation.recipient,
    recipients: automation.recipient?.recipients || [automation.recipient?.email].filter(Boolean),
    subject: automation.generatedContent?.subject,
    message: automation.generatedContent?.body,
    content: automation.generatedContent?.body,
    htmlContent: automation.generatedContent?.htmlBody,
    attachments: automation.attachments || [],
    language: automation.language
  };

  const result = await n8nService.triggerWorkflow(payload);

  if (result.success) {
    const completedAt = new Date();
    const startTime = automation.executedAt ? new Date(automation.executedAt).getTime() : Date.now();
    const responseTimeMs = Math.max(0, completedAt.getTime() - startTime);

    automation.status = 'SUCCESS';
    automation.n8nExecutionId = result.n8nExecutionId;
    automation.completedAt = completedAt;
    automation.responseTimeMs = responseTimeMs;
    await automation.save();

    const viaLabel = result.via === 'direct_email'
      ? 'Gmail Direct SMTP Engine'
      : (result.via === 'direct_telegram' ? 'Telegram Direct Engine' : 'n8n Workflow');

    await ActivityLog.create({
      userId,
      automationId,
      executionId,
      jobId: job.id,
      action: `WORKFLOW_SUCCESS_${automation.channel.toUpperCase()}`,
      channel: automation.channel,
      status: 'SUCCESS',
      message: `Delivered successfully via ${viaLabel} (${result.n8nExecutionId})`
    });

    emitStatusUpdate(automationId, {
      userId,
      status: 'SUCCESS',
      step: 'completed',
      message: `✓ Successfully delivered via ${viaLabel}!`,
      via: result.via,
      n8nExecutionId: result.n8nExecutionId,
      responseTimeMs
    });

    console.log(`[CommandWorker] Automation ${automationId} completed successfully via ${viaLabel} in ${responseTimeMs}ms!`);
    return { success: true, via: result.via, executionId };
  } else {
    // Failure handling & retry evaluation
    const errorMsg = result.error || 'Automation execution failed.';
    const isFinalAttempt = job.attemptsMade + 1 >= automation.maxRetries;

    console.error(`[CommandWorker] Automation ${automationId} execution error: ${errorMsg}`);

    if (isFinalAttempt) {
      automation.status = 'FAILED';
      automation.error = errorMsg;
      automation.completedAt = new Date();
      await automation.save();

      await ActivityLog.create({
        userId,
        automationId,
        executionId,
        jobId: job.id,
        action: `WORKFLOW_FAILED_${automation.channel.toUpperCase()}`,
        channel: automation.channel,
        status: 'FAILED',
        message: `Execution failed after ${automation.attempts} attempts: ${errorMsg}`
      });

      emitStatusUpdate(automationId, {
        userId,
        status: 'FAILED',
        step: 'failed',
        error: errorMsg,
        message: `Execution failed: ${errorMsg}`
      });

      return { success: false, error: errorMsg };
    } else {
      automation.status = 'RETRYING';
      automation.lastError = errorMsg;
      await automation.save();

      emitStatusUpdate(automationId, {
        userId,
        status: 'RETRYING',
        step: 'retrying',
        message: `Temporary error encountered. Retrying in background (attempt ${job.attemptsMade + 1}/${automation.maxRetries})...`,
        lastError: errorMsg
      });

      // If job is running via in-process fallback (no BullMQ Redis runner),
      // schedule an in-process retry after backoff rather than throwing into the void
      if (typeof job.id === 'string' && job.id.startsWith('fb-')) {
        const nextAttempt = (job.attemptsMade || 0) + 1;
        const delay = Math.pow(2, nextAttempt) * 1000;
        console.log(`[CommandWorker] In-process fallback retry scheduled in ${delay}ms (attempt ${nextAttempt + 1}/${automation.maxRetries})...`);
        setTimeout(() => {
          processJob({
            ...job,
            attemptsMade: nextAttempt
          }).catch(retryErr => {
            console.error(`[CommandWorker] Fallback retry error: ${retryErr.message}`);
          });
        }, delay);
        return { retrying: true, attempt: nextAttempt };
      }

      // Throw error to trigger BullMQ exponential backoff retry
      throw new Error(errorMsg);
    }
  }
};

/**
 * Initialize and start the BullMQ worker
 */
const initWorker = () => {
  if (workerInstance) return workerInstance;

  try {
    workerInstance = new Worker('commandQueue', processJob, {
      connection: redisOptions,
      concurrency: 5,
      limiter: {
        max: 20,
        duration: 1000 // Rate limit: max 20 jobs/sec
      }
    });

    workerInstance.on('completed', (job) => {
      console.log(`[CommandWorker] Job ${job.id} completed.`);
    });

    workerInstance.on('failed', (job, err) => {
      console.warn(`[CommandWorker] Job ${job?.id} failed: ${err.message}`);
    });

    workerInstance.on('error', (err) => {
      // Suppress connection spam
    });

    console.log('[CommandWorker] Worker initialized and listening on commandQueue.');
    return workerInstance;
  } catch (err) {
    console.warn(`[CommandWorker Notice]: Could not start BullMQ worker (${err.message}). Using fallback processing.`);
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
  processJob
};
