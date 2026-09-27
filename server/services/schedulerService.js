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

          let generatedBody = auto.generatedContent?.body || auto.generatedContent?.content || '';
          let generatedSubject = auto.generatedContent?.subject || '';
          let generatedHtml = auto.generatedContent?.htmlBody || generatedBody;

          // If subject or body is missing, dynamically generate via AI engine
          if (!generatedBody || !generatedSubject) {
            console.log(`[Scheduler Worker] Missing generated content for ${auto.automationId}, generating via AI...`);
            try {
              const groqService = require('./groqService');
              const aiParsed = await groqService.processCommand({ userCommand: auto.originalCommand || sched.command });
              generatedSubject = generatedSubject || aiParsed.subject || 'Scheduled Communication';
              generatedBody = generatedBody || aiParsed.message || aiParsed.content || sched.command;
              generatedHtml = generatedHtml || aiParsed.htmlBody || generatedBody;
            } catch (aiErr) {
              console.warn(`[Scheduler Worker AI Warning]: ${aiErr.message}`);
              generatedSubject = generatedSubject || 'Scheduled Notification';
              generatedBody = generatedBody || sched.command;
              generatedHtml = generatedHtml || generatedBody;
            }
          }

          // Dispatch payload to guaranteed delivery engine
          const n8nResult = await n8nService.triggerWorkflow({
            automationId: auto.automationId,
            userCommand: auto.originalCommand || sched.command,
            userId: auto.userId.toString(),
            intent: auto.intent || (auto.channel === 'gmail' ? 'send_email' : 'send_message'),
            channel: auto.channel || 'gmail',
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
              action: `SCHEDULED_EXECUTION_${(auto.channel || 'gmail').toUpperCase()}`,
              channel: auto.channel || 'gmail',
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
              action: `SCHEDULED_EXECUTION_${(auto.channel || 'gmail').toUpperCase()}_FAILED`,
              channel: auto.channel || 'gmail',
              status: 'FAILED',
              message: `Scheduled execution failed: ${n8nResult.error}`
            });

            console.error(`[Scheduler Worker] Failed to execute ${sched.automationId}: ${n8nResult.error}`);
          }
        } else {
          // If no Automation record exists, dynamically process the scheduled command
          console.log(`[Scheduler Worker] No Automation record for ${sched.automationId}, processing command directly...`);
          try {
            const groqService = require('./groqService');
            const emailService = require('./emailService');
            const aiParsed = await groqService.processCommand({ userCommand: sched.command });
            const emailMatch = (sched.command || '').match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            const targetRecipients = aiParsed.recipients?.length > 0 ? aiParsed.recipients : emailMatch;
            
            if (targetRecipients.length > 0) {
              const emailResult = await emailService.sendEmail({
                to: targetRecipients,
                subject: aiParsed.subject || 'Scheduled Communication',
                content: aiParsed.message || aiParsed.content || sched.command,
                htmlContent: aiParsed.htmlBody || ''
              });
              sched.status = 'SUCCESS';
              await sched.save();
              console.log(`[Scheduler Worker] Successfully dispatched orphan schedule ${sched.automationId} to ${targetRecipients.join(', ')}`);
            } else {
              sched.status = 'FAILED';
              await sched.save();
            }
          } catch (e) {
            console.error(`[Scheduler Worker] Failed processing orphan schedule: ${e.message}`);
            sched.status = 'FAILED';
            await sched.save();
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler Worker Error]:', err.message);
    }
  });
};

module.exports = { initScheduler };
