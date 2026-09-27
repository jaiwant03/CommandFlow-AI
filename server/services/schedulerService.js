const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const n8nService = require('./n8nService');

/**
 * Background Scheduler Worker
 * Periodically checks for scheduled automations that are due and dispatches them to execution engines.
 */
const initScheduler = () => {
  console.log('[Scheduler Worker] Initialized background runner (polling every 10s)...');

  cron.schedule('*/10 * * * * *', async () => {
    try {
      const now = new Date();
      // Find schedules with status 'SCHEDULED' or 'Scheduled' where nextExecution <= now
      const dueSchedules = await Schedule.find({
        status: { $in: ['SCHEDULED', 'Scheduled'] },
        nextExecution: { $lte: now }
      });

      if (dueSchedules.length > 0) {
        console.log(`[Scheduler Worker] Found ${dueSchedules.length} due scheduled automations at ${now.toISOString()}.`);
      }

      for (const sched of dueSchedules) {
        console.log(`[Scheduler Worker] Executing scheduled automation: ${sched.automationId}`);

        sched.status = 'PROCESSING';
        await sched.save();

        const auto = await Automation.findOne({ automationId: sched.automationId });
        if (auto) {
          auto.status = 'PROCESSING';
          await auto.save();

          let recipientsList = auto.recipient?.recipients && auto.recipient.recipients.length > 0
            ? auto.recipient.recipients
            : [auto.recipient?.email].filter(Boolean);

          // Fallback extraction if recipients array was empty
          if (recipientsList.length === 0) {
            const emailMatch = (auto.originalCommand || sched.command || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatch && emailMatch.length > 0) {
              recipientsList = Array.from(new Set(emailMatch));
            }
          }

          const generatedBody = auto.generatedContent?.body || auto.generatedContent?.content || '';
          const generatedSubject = auto.generatedContent?.subject || 'Scheduled Communication';
          const generatedHtml = auto.generatedContent?.htmlBody || generatedBody;

          // Dispatch payload to guaranteed delivery engine
          const n8nResult = await n8nService.triggerWorkflow({
            automationId: auto.automationId,
            userCommand: auto.originalCommand || sched.command,
            userId: auto.userId.toString(),
            intent: auto.intent,
            channel: auto.channel,
            recipient: {
              name: auto.recipient?.name || 'Recipient',
              email: recipientsList[0] || auto.recipient?.email,
              chatId: auto.recipient?.telegramId
            },
            recipients: recipientsList,
            subject: generatedSubject,
            message: generatedBody,
            content: generatedBody,
            htmlContent: generatedHtml,
            attachments: auto.attachments || [],
            language: auto.language
          });

          if (n8nResult.success) {
            sched.status = 'SUCCESS';
            await sched.save();

            auto.status = 'SUCCESS';
            auto.n8nExecutionId = n8nResult.n8nExecutionId;
            auto.completedAt = new Date();
            auto.responseTimeMs = Math.max(0, auto.completedAt.getTime() - new Date(auto.executedAt || auto.createdAt).getTime());
            await auto.save();

            const viaMsg = n8nResult.via === 'direct_email' 
              ? 'Gmail Direct Engine' 
              : (n8nResult.via === 'direct_telegram' ? 'Telegram Direct Engine' : 'n8n Workflow');

            await ActivityLog.create({
              userId: auto.userId,
              automationId: auto.automationId,
              action: `SCHEDULED_EXECUTION_${auto.channel.toUpperCase()}`,
              channel: auto.channel,
              status: 'SUCCESS',
              message: `Scheduled automation executed and delivered successfully via ${viaMsg} (${n8nResult.n8nExecutionId})`
            });

            console.log(`[Scheduler Worker] Successfully executed and delivered ${sched.automationId} via ${viaMsg}.`);
          } else {
            sched.status = 'FAILED';
            await sched.save();

            auto.status = 'FAILED';
            auto.error = n8nResult.error;
            await auto.save();

            await ActivityLog.create({
              userId: auto.userId,
              automationId: auto.automationId,
              action: `SCHEDULED_EXECUTION_${auto.channel.toUpperCase()}_FAILED`,
              channel: auto.channel,
              status: 'FAILED',
              message: `Scheduled execution failed: ${n8nResult.error}`
            });

            console.error(`[Scheduler Worker] Failed to execute ${sched.automationId}: ${n8nResult.error}`);
          }
        } else {
          sched.status = 'FAILED';
          await sched.save();
        }
      }
    } catch (err) {
      console.error('[Scheduler Worker Error]:', err.message);
    }
  });
};

module.exports = { initScheduler };
