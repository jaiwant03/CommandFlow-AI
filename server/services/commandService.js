const Automation = require('../models/Automation');
const Schedule = require('../models/Schedule');
const ActivityLog = require('../models/ActivityLog');
const groqService = require('./groqService');
const contactService = require('./contactService');
const { validateCommandPlan } = require('../validators/commandValidator');
const { addCommandJob } = require('../queues/commandQueue');
const { emitStatusUpdate } = require('../sockets/socketManager');
const {
  isExecutionBusy,
  claimImmediateSlot,
  getQueuePosition,
  startExecution,
  endExecution,
  enqueueFallbackJob,
  executeAutomation
} = require('./executionManager');
const AppError = require('../utils/appError');

const generateAutomationId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AUTO-${year}-${rand}`;
};

/**
 * High-level Command Orchestrator Service
 */
class CommandService {
  /**
   * Process raw command, resolve contacts, parse AI intent, validate, persist in DB and enqueue in BullMQ
   */
  async processAndEnqueueCommand({
    userId,
    command,
    inputType = 'text',
    attachments = [],
    idempotencyKey = null
  }) {
    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await Automation.findOne({ idempotencyKey, userId });
      if (existing) {
        console.log(`[CommandService] Idempotent request matched existing automation: ${existing.automationId}`);
        return {
          automation: existing,
          isDuplicate: true,
          status: existing.status
        };
      }
    }

    // 2. Process Command via Groq AI
    const aiParsed = await groqService.processCommand({ userCommand: command }, attachments);
    const aiTokenUsage = Number(aiParsed?.tokenUsage?.total_tokens || aiParsed?.tokenUsage || 0) || 0;

    // 3. Intelligent Contact Resolution (Resolve names like "Arun" or "Jaswant" from MongoDB)
    let resolvedContact = null;
    const currentRecipients = aiParsed.recipients || (aiParsed.recipient?.email ? [aiParsed.recipient.email] : []);
    const isPlaceholderEmail = currentRecipients.length === 0 || currentRecipients.some(r => 
      !r || 
      !r.includes('@') || 
      r.includes('@example.com') || 
      r.includes('@test.com') || 
      r.includes('@sample.com') || 
      r.includes('placeholder')
    );

    const shouldResolveFromContacts = isPlaceholderEmail || (aiParsed.recipient?.name && aiParsed.recipient.name.toLowerCase() !== 'recipient');

    if (shouldResolveFromContacts) {
      resolvedContact = await contactService.resolveRecipient(userId, {
        nameHint: aiParsed.recipient?.name,
        commandText: command,
        channel: aiParsed.channel
      });

      if (resolvedContact) {
        console.log(`[CommandService] Contact resolved from database: "${resolvedContact.name}" -> ${resolvedContact.email || resolvedContact.telegramId}`);
        if (aiParsed.channel === 'gmail' && resolvedContact.email) {
          aiParsed.recipients = [resolvedContact.email];
          aiParsed.recipient = {
            ...aiParsed.recipient,
            name: resolvedContact.name,
            email: resolvedContact.email,
            recipients: [resolvedContact.email],
            contactId: resolvedContact.contactId || resolvedContact._id
          };
        } else if (aiParsed.channel === 'telegram' && (resolvedContact.telegramId || resolvedContact.chatId)) {
          const tid = resolvedContact.telegramId || resolvedContact.chatId;
          aiParsed.recipients = [tid];
          aiParsed.recipient = {
            ...aiParsed.recipient,
            name: resolvedContact.name,
            chatId: tid,
            telegramId: tid,
            contactId: resolvedContact.contactId || resolvedContact._id
          };
        }
      }
    }

    // 4. Validate Command Plan strictly
    const validatedPlan = validateCommandPlan(aiParsed);

    const automationId = generateAutomationId();
    const isScheduled = !!(validatedPlan.schedule && validatedPlan.schedule.isScheduled);
    const scheduledTime = isScheduled && validatedPlan.schedule.nextExecution
      ? new Date(validatedPlan.schedule.nextExecution)
      : null;

    // Atomically claim the immediate execution slot if system is currently idle
    const isImmediateClaimed = !isScheduled && claimImmediateSlot(automationId);
    const isBusy = !isScheduled && !isImmediateClaimed;
    const initialStatus = isScheduled ? 'SCHEDULED' : (isBusy ? 'QUEUED' : 'PROCESSING');

    // 5. Persist Command in MongoDB
    const automation = await Automation.create({
      automationId,
      idempotencyKey: idempotencyKey || `IDEM-${automationId}`,
      userId,
      originalCommand: command,
      language: validatedPlan.language || 'english',
      inputType,
      intent: validatedPlan.intent,
      channel: validatedPlan.channel,
      recipient: {
        name: validatedPlan.recipient?.name || 'Recipient',
        email: validatedPlan.recipients[0] || validatedPlan.recipient?.email || '',
        recipients: validatedPlan.recipients,
        telegramId: validatedPlan.recipient?.chatId || validatedPlan.recipient?.telegramId || '',
        contactId: resolvedContact?.contactId || null
      },
      generatedContent: (() => {
        const { formatEmailContent } = require('../utils/emailFormatter');
        if (validatedPlan.channel === 'gmail') {
          const formatted = formatEmailContent({
            subject: validatedPlan.subject,
            content: validatedPlan.message,
            htmlContent: validatedPlan.htmlBody || aiParsed.htmlBody
          });
          return {
            subject: validatedPlan.subject || '',
            body: formatted.plainText || validatedPlan.message,
            htmlBody: formatted.html
          };
        }
        return {
          subject: validatedPlan.subject || '',
          body: validatedPlan.message,
          htmlBody: validatedPlan.htmlBody || ''
        };
      })(),
      attachments,
      schedule: {
        date: validatedPlan.schedule?.date || null,
        time: validatedPlan.schedule?.time || null,
        cron: null,
        nextExecution: scheduledTime
      },
      aiTokenUsage,
      responseTimeMs: 0,
      status: initialStatus
    });

    // 6. Handle Scheduling
    if (isScheduled) {
      await Schedule.create({
        userId,
        automationId,
        command,
        scheduleDetails: {
          date: validatedPlan.schedule?.date,
          time: validatedPlan.schedule?.time,
          timezone: validatedPlan.schedule?.timezone || 'Asia/Kolkata'
        },
        nextExecution: scheduledTime,
        status: 'SCHEDULED'
      });

      await ActivityLog.create({
        userId,
        automationId,
        action: 'SCHEDULE_AUTOMATION',
        channel: validatedPlan.channel,
        status: 'SCHEDULED',
        message: `Scheduled automation set for ${scheduledTime ? scheduledTime.toLocaleString('en-IN') : 'future execution'}`
      });

      emitStatusUpdate(automationId, {
        userId,
        status: 'SCHEDULED',
        scheduledTime: scheduledTime ? scheduledTime.toISOString() : null,
        message: 'Automation scheduled successfully.'
      });

      return {
        automation,
        isScheduled: true,
        status: 'SCHEDULED'
      };
    }

    // 7. Execution: Immediate Execution (if idle) OR Queue in BullMQ (if busy with active command)
    if (isImmediateClaimed) {
      // --- IMMEDIATE EXECUTION PATH ---
      // No active command running -> execute and send immediately without queueing delay!
      console.log(`[CommandService] System is idle. Executing ${automationId} IMMEDIATELY (no BullMQ queuing)...`);
      try {
        const execResult = await executeAutomation({
          automationId,
          userId,
          command,
          inputType,
          plan: validatedPlan,
          idempotencyKey: automation.idempotencyKey
        }, {
          isImmediate: true,
          jobId: 'immediate'
        });

        return {
          automation: execResult.automation || automation,
          isScheduled: false,
          isImmediate: true,
          status: execResult.automation ? execResult.automation.status : 'SUCCESS'
        };
      } finally {
        endExecution(automationId);
      }
    } else {
      // --- QUEUED IN BULLMQ PATH ---
      // Active command in progress -> queue 2nd, 3rd, etc. into BullMQ!
      const queuePos = await getQueuePosition();
      console.log(`[CommandService] System busy with active command. Enqueueing ${automationId} into BullMQ (Position #${queuePos})...`);

      await ActivityLog.create({
        userId,
        automationId,
        action: `COMMAND_QUEUED_${validatedPlan.channel.toUpperCase()}`,
        channel: validatedPlan.channel,
        status: 'QUEUED',
        message: `Another command is currently executing. Command queued in BullMQ (Position #${queuePos})`
      });

      emitStatusUpdate(automationId, {
        userId,
        status: 'QUEUED',
        step: 'queued',
        queuePosition: queuePos,
        message: `Another command is currently executing. Command queued in BullMQ (Position #${queuePos}).`
      });

      const queueResult = await addCommandJob({
        automationId,
        userId,
        command,
        inputType,
        plan: validatedPlan,
        idempotencyKey: automation.idempotencyKey
      });

      if (queueResult.success) {
        automation.jobId = queueResult.jobId;
        await automation.save();
      } else if (queueResult.fallbackRequired) {
        // Enqueue into in-process sequential queue
        enqueueFallbackJob({
          automationId,
          userId,
          command,
          inputType,
          plan: validatedPlan,
          idempotencyKey: automation.idempotencyKey
        });
      }

      return {
        automation,
        isScheduled: false,
        isImmediate: false,
        isQueued: true,
        queuePosition: queuePos,
        status: 'QUEUED'
      };
    }
  }

  /**
   * Retry a failed automation command
   */
  async retryCommand(userId, automationId) {
    const automation = await Automation.findOne({ automationId, userId });
    if (!automation) {
      throw new AppError('Automation record not found.', 404, 'NOT_FOUND');
    }

    if (automation.status === 'PROCESSING' || automation.status === 'QUEUED') {
      throw new AppError('Command is already being processed.', 400, 'ALREADY_PROCESSING');
    }

    const busy = await isExecutionBusy();

    if (!busy) {
      automation.status = 'PROCESSING';
      await automation.save();
      startExecution(automationId);
      try {
        const execResult = await executeAutomation({
          automationId,
          userId,
          command: automation.originalCommand,
          inputType: automation.inputType,
          plan: {
            intent: automation.intent,
            channel: automation.channel,
            recipient: automation.recipient,
            recipients: automation.recipient?.recipients || [automation.recipient?.email],
            subject: automation.generatedContent?.subject,
            message: automation.generatedContent?.body
          },
          idempotencyKey: `RETRY-${automationId}-${Date.now()}`
        }, { isImmediate: true, jobId: 'immediate-retry' });
        return execResult.automation || automation;
      } finally {
        endExecution(automationId);
      }
    } else {
      automation.status = 'QUEUED';
      automation.attempts = 0;
      automation.error = null;
      await automation.save();

      await ActivityLog.create({
        userId,
        automationId,
        action: 'COMMAND_MANUAL_RETRY',
        channel: automation.channel,
        status: 'QUEUED',
        message: 'Command manually re-queued for execution'
      });

      emitStatusUpdate(automationId, {
        userId,
        status: 'QUEUED',
        message: 'Command re-queued in BullMQ for execution.'
      });

      const queueResult = await addCommandJob({
        automationId,
        userId,
        command: automation.originalCommand,
        inputType: automation.inputType,
        plan: {
          intent: automation.intent,
          channel: automation.channel,
          recipient: automation.recipient,
          recipients: automation.recipient?.recipients || [automation.recipient?.email],
          subject: automation.generatedContent?.subject,
          message: automation.generatedContent?.body
        },
        idempotencyKey: `RETRY-${automationId}-${Date.now()}`
      });

      if (queueResult.fallbackRequired) {
        enqueueFallbackJob({
          automationId,
          userId,
          command: automation.originalCommand,
          inputType: automation.inputType,
          plan: {
            intent: automation.intent,
            channel: automation.channel,
            recipient: automation.recipient,
            recipients: automation.recipient?.recipients || [automation.recipient?.email],
            subject: automation.generatedContent?.subject,
            message: automation.generatedContent?.body
          },
          idempotencyKey: `RETRY-${automationId}-${Date.now()}`
        });
      }

      return automation;
    }
  }

  /**
   * Cancel a scheduled automation command
   */
  async cancelCommand(userId, automationId) {
    const automation = await Automation.findOne({ automationId, userId });
    if (!automation) {
      throw new AppError('Automation record not found.', 404, 'NOT_FOUND');
    }

    if (automation.status === 'SUCCESS' || automation.status === 'SENT') {
      throw new AppError('Cannot cancel an already completed automation.', 400, 'ALREADY_COMPLETED');
    }

    automation.status = 'CANCELLED';
    await automation.save();

    await Schedule.updateMany({ automationId, userId }, { status: 'CANCELLED' });

    await ActivityLog.create({
      userId,
      automationId,
      action: 'COMMAND_CANCELLED',
      channel: automation.channel,
      status: 'CANCELLED',
      message: 'Automation was cancelled by the user'
    });

    emitStatusUpdate(automationId, {
      userId,
      status: 'CANCELLED',
      message: 'Automation has been cancelled.'
    });

    return automation;
  }
}

module.exports = new CommandService();
