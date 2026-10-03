const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const n8nService = require('./n8nService');
const { emitStatusUpdate } = require('../sockets/socketManager');
const { getQueueCounts } = require('../queues/commandQueue');

// In-memory active execution tracker (automationId -> startTime)
const activeExecutions = new Map();

// In-memory fallback queue for FIFO sequential execution if Redis is unavailable
const fallbackQueue = [];
let isDrainingFallback = false;

/**
 * Check if another automation (different from the given ID) is currently executing
 */
const isExecutingOther = (currentAutomationId) => {
  if (activeExecutions.size === 0) return false;
  if (activeExecutions.size === 1 && activeExecutions.has(currentAutomationId)) return false;
  return true;
};

/**
 * Register that an automation has started execution
 */
const startExecution = (automationId) => {
  activeExecutions.set(automationId, Date.now());
  console.log(`[ExecutionManager] Started execution for ${automationId} (Active count: ${activeExecutions.size})`);
};

/**
 * Mark execution finished and trigger drainage of any queued fallback jobs
 */
const endExecution = (automationId) => {
  if (automationId) {
    activeExecutions.delete(automationId);
    console.log(`[ExecutionManager] Finished execution for ${automationId} (Active count: ${activeExecutions.size})`);
  }

  // Safety cleanup: clear any dangling locks older than 45 seconds
  const now = Date.now();
  for (const [id, startTime] of activeExecutions.entries()) {
    if (now - startTime > 45000) {
      console.warn(`[ExecutionManager] Clearing stale execution lock for ${id} (ran > 45s)`);
      activeExecutions.delete(id);
    }
  }

  // Drain any pending in-process fallback jobs
  drainFallbackQueue().catch(err => {
    console.error('[ExecutionManager] drainFallbackQueue error:', err.message);
  });
};

/**
 * Determine if the execution engine is currently busy.
 * Returns true if an active command is currently running or commands are waiting in the queue.
 */
const isExecutionBusy = async () => {
  // 1. Clean stale in-memory executions (> 45s)
  const now = Date.now();
  for (const [id, startTime] of activeExecutions.entries()) {
    if (now - startTime > 45000) {
      activeExecutions.delete(id);
    }
  }

  // 2. In-memory active execution
  if (activeExecutions.size > 0) {
    return true;
  }

  // 3. Fallback queue in memory
  if (fallbackQueue.length > 0) {
    return true;
  }

  // 4. BullMQ active or waiting jobs
  try {
    const counts = await getQueueCounts();
    if (counts.isHealthy && (counts.active > 0 || counts.waiting > 0)) {
      return true;
    }
  } catch (err) {
    // Ignore Redis errors
  }

  // 5. MongoDB active records in the last 30 seconds
  try {
    const activeInDb = await Automation.countDocuments({
      status: { $in: ['PROCESSING', 'SENDING'] },
      updatedAt: { $gte: new Date(Date.now() - 30000) }
    });
    if (activeInDb > 0) {
      return true;
    }
  } catch (err) {
    // Ignore DB errors
  }

  return false;
};

/**
 * Get current 1-based queue position for newly enqueued commands
 */
const getQueuePosition = async () => {
  let position = activeExecutions.size > 0 ? 1 : 0;
  try {
    const counts = await getQueueCounts();
    if (counts.isHealthy) {
      position += (counts.waiting || 0) + (counts.active || 0);
    }
  } catch (e) {}
  position += fallbackQueue.length;
  return Math.max(1, position);
};

/**
 * Add a job to the in-memory fallback queue (used when Redis is offline)
 */
const enqueueFallbackJob = (jobData) => {
  fallbackQueue.push(jobData);
  console.log(`[ExecutionManager] Enqueued fallback job ${jobData.automationId} (Fallback queue size: ${fallbackQueue.length})`);
};

/**
 * Drain in-memory fallback queue sequentially
 */
const drainFallbackQueue = async () => {
  if (isDrainingFallback || fallbackQueue.length === 0) return;
  if (activeExecutions.size > 0) return;

  isDrainingFallback = true;
  try {
    while (fallbackQueue.length > 0 && activeExecutions.size === 0) {
      const nextJob = fallbackQueue.shift();
      if (!nextJob) break;

      console.log(`[ExecutionManager] Picking up queued fallback job: ${nextJob.automationId}`);
      startExecution(nextJob.automationId);
      try {
        await executeAutomation(nextJob, {
          jobId: `fb-${nextJob.automationId}`,
          isImmediate: false
        });
      } catch (err) {
        console.error(`[ExecutionManager] Fallback execution error for ${nextJob.automationId}:`, err.message);
      } finally {
        endExecution(nextJob.automationId);
      }
    }
  } finally {
    isDrainingFallback = false;
  }
};

/**
 * Reset stale PROCESSING/SENDING records on server startup
 */
const resetStaleExecutions = async () => {
  try {
    const res = await Automation.updateMany(
      { status: { $in: ['PROCESSING', 'SENDING'] } },
      { status: 'FAILED', error: 'Server restarted during processing' }
    );
    if (res.modifiedCount > 0) {
      console.log(`[ExecutionManager] Reset ${res.modifiedCount} stale in-flight automations to FAILED on startup.`);
    }
  } catch (err) {
    console.warn(`[ExecutionManager] Could not reset stale automations:`, err.message);
  }
};

/**
 * Core Automation Execution Logic
 * Shared by both Immediate Execution and BullMQ Worker Processing
 */
const executeAutomation = async (
  { automationId, userId, command, inputType = 'text', plan, idempotencyKey },
  { jobId = 'immediate', attemptsMade = 0, isImmediate = false } = {}
) => {
  const executionId = `EXEC-${automationId}-${Date.now()}`;

  console.log(`[ExecutionManager] Executing ${automationId} (${isImmediate ? 'IMMEDIATE' : 'QUEUED_WORKER'}, attempt: ${attemptsMade + 1})`);

  // 1. Load automation record
  let automation = await Automation.findOne({ automationId });
  if (!automation) {
    console.error(`[ExecutionManager] Automation record ${automationId} not found in database.`);
    throw new Error(`Automation record ${automationId} not found.`);
  }

  // 2. Idempotency Check - prevent duplicate sends
  if (automation.status === 'SUCCESS' || automation.status === 'SENT') {
    console.log(`[ExecutionManager] Idempotency guard: ${automationId} already succeeded with status '${automation.status}'. Skipping.`);
    emitStatusUpdate(automationId, {
      userId,
      status: 'SUCCESS',
      message: 'Command already completed successfully.'
    });
    return { success: true, automation, alreadyCompleted: true, status: automation.status };
  }

  // 3. Mark as PROCESSING & notify UI
  automation.status = 'PROCESSING';
  automation.executionId = executionId;
  automation.jobId = jobId;
  automation.attempts = attemptsMade + 1;
  await automation.save();

  emitStatusUpdate(automationId, {
    userId,
    status: 'PROCESSING',
    step: isImmediate ? 'immediate_processing' : 'worker_processing',
    message: isImmediate
      ? 'Executing command pipeline immediately...'
      : 'Worker processing queued command pipeline...',
    attempts: automation.attempts
  });

  await ActivityLog.create({
    userId,
    automationId,
    executionId,
    jobId,
    action: `COMMAND_PROCESSING_${automation.channel.toUpperCase()}`,
    channel: automation.channel,
    status: 'PROCESSING',
    message: isImmediate
      ? `Executing command immediately without queuing (attempt ${automation.attempts})`
      : `Worker picked up queued job ${jobId} (attempt ${automation.attempts})`
  });

  // 4. Update status to SENDING
  emitStatusUpdate(automationId, {
    userId,
    status: 'SENDING',
    step: 'dispatching',
    message: `Dispatching payload to ${automation.channel === 'gmail' ? 'Gmail SMTP' : 'Telegram Bot'} engine...`
  });

  // 5. Build payload & execute via n8n / SMTP / Telegram
  const payload = {
    automationId,
    userCommand: command || automation.originalCommand,
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
      jobId,
      action: `WORKFLOW_SUCCESS_${automation.channel.toUpperCase()}`,
      channel: automation.channel,
      status: 'SUCCESS',
      message: isImmediate
        ? `Delivered immediately via ${viaLabel} (${result.n8nExecutionId})`
        : `Delivered successfully from queue via ${viaLabel} (${result.n8nExecutionId})`
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

    console.log(`[ExecutionManager] Automation ${automationId} completed successfully via ${viaLabel} in ${responseTimeMs}ms!`);
    return { success: true, automation, via: result.via, executionId };
  } else {
    // Failure handling
    const errorMsg = result.error || 'Automation execution failed.';
    const isFinalAttempt = attemptsMade + 1 >= (automation.maxRetries || 3);

    console.error(`[ExecutionManager] Automation ${automationId} execution error: ${errorMsg}`);

    if (isFinalAttempt) {
      automation.status = 'FAILED';
      automation.error = errorMsg;
      automation.completedAt = new Date();
      await automation.save();

      await ActivityLog.create({
        userId,
        automationId,
        executionId,
        jobId,
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

      return { success: false, automation, error: errorMsg };
    } else {
      automation.status = 'RETRYING';
      automation.lastError = errorMsg;
      await automation.save();

      emitStatusUpdate(automationId, {
        userId,
        status: 'RETRYING',
        step: 'retrying',
        message: `Temporary error encountered. Retrying in background (attempt ${attemptsMade + 1}/${automation.maxRetries})...`,
        lastError: errorMsg
      });

      if (isImmediate) {
        // Immediate failure: schedule in-process retry
        const nextAttempt = attemptsMade + 1;
        const delay = Math.pow(2, nextAttempt) * 1000;
        setTimeout(() => {
          executeAutomation(
            { automationId, userId, command, inputType, plan, idempotencyKey },
            { jobId: `retry-${automationId}`, attemptsMade: nextAttempt, isImmediate: true }
          ).catch(retryErr => {
            console.error(`[ExecutionManager] Immediate retry error: ${retryErr.message}`);
          });
        }, delay);
        return { success: false, automation, retrying: true, attempt: nextAttempt };
      }

      throw new Error(errorMsg);
    }
  }
};

module.exports = {
  isExecutionBusy,
  getQueuePosition,
  startExecution,
  endExecution,
  isExecutingOther,
  enqueueFallbackJob,
  drainFallbackQueue,
  resetStaleExecutions,
  executeAutomation
};
