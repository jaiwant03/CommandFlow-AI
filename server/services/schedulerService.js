const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const n8nService = require('./n8nService');

/**
 * Background Scheduler Worker
 * Periodically checks for scheduled automations that are due and dispatches them to n8n
 */
const initScheduler = () => {
  console.log('[Scheduler Worker] Initialized background runner (polling every 30s)...');

  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();
      // Find schedules with status 'SCHEDULED' or 'Scheduled' where nextExecution <= now
      const dueSchedules = await Schedule.find({
        status: { $in: ['SCHEDULED', 'Scheduled'] },
        nextExecution: { $lte: now }
      });

      if (dueSchedules.length > 0) {
        console.log(`[Scheduler Worker] Found ${dueSchedules.length} due scheduled automations.`);
      }

      for (const sched of dueSchedules) {
        console.log(`[Scheduler Worker] Executing scheduled automation: ${sched.automationId}`);

        sched.status = 'PROCESSING';
        await sched.save();

        const auto = await Automation.findOne({ automationId: sched.automationId });
        if (auto) {
          auto.status = 'PROCESSING';
          await auto.save();

          const recipientsList = auto.recipient?.recipients && auto.recipient.recipients.length > 0
            ? auto.recipient.recipients
            : [auto.recipient?.email].filter(Boolean);

          // Dispatch payload to published n8n webhook
          const n8nResult = await n8nService.triggerWorkflow({
            automationId: auto.automationId,
            userId: auto.userId.toString(),
            intent: auto.intent,
            channel: auto.channel,
            recipient: {
              name: auto.recipient?.name,
              email: auto.recipient?.email,
              chatId: auto.recipient?.telegramId
            },
            recipients: recipientsList,
            subject: auto.generatedContent?.subject,
            content: auto.generatedContent?.body,
            htmlContent: auto.generatedContent?.htmlBody || auto.generatedContent?.body,
            attachments: auto.attachments || [],
            language: auto.language
          });

          if (n8nResult.success) {
            sched.status = 'SUCCESS';
            await sched.save();

            auto.status = 'SUCCESS';
            auto.n8nExecutionId = n8nResult.n8nExecutionId;
            auto.completedAt = new Date();
            await auto.save();

            await ActivityLog.create({
              userId: auto.userId,
              automationId: auto.automationId,
              action: `SCHEDULED_EXECUTION_${auto.channel.toUpperCase()}`,
              channel: auto.channel,
              status: 'SUCCESS',
              message: `Scheduled automation executed successfully via n8n`
            });
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
