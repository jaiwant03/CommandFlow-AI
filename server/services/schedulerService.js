const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const { addCommandJob } = require('../queues/commandQueue');
const { emitStatusUpdate } = require('../sockets/socketManager');

/**
 * Background Scheduler Runner
 * Checks for scheduled automations that are due and enqueues them into BullMQ.
 * Works even when client browser is closed.
 */
const initScheduler = () => {
  console.log('[Scheduler] Initialized background scheduler runner (evaluating every 10s)...');

  cron.schedule('*/10 * * * * *', async () => {
    try {
      const now = new Date();
      // Find schedules with status 'SCHEDULED' or 'Scheduled' where nextExecution <= now
      const dueSchedules = await Schedule.find({
        status: { $in: ['SCHEDULED', 'Scheduled'] },
        nextExecution: { $lte: now }
      });

      for (const sched of dueSchedules) {
        console.log(`[Scheduler] Dispatching due scheduled automation to BullMQ: ${sched.automationId}`);

        sched.status = 'QUEUED';
        await sched.save();

        const auto = await Automation.findOne({ automationId: sched.automationId });
        if (auto) {
          auto.status = 'QUEUED';
          await auto.save();

          emitStatusUpdate(auto.automationId, {
            userId: auto.userId,
            status: 'QUEUED',
            step: 'scheduler_enqueued',
            message: 'Scheduled execution time reached. Enqueued into worker pipeline.'
          });

          await ActivityLog.create({
            userId: auto.userId,
            automationId: auto.automationId,
            action: 'SCHEDULED_JOB_ENQUEUED',
            channel: auto.channel,
            status: 'QUEUED',
            message: `Scheduled automation reached target time (${sched.nextExecution.toISOString()}) and was dispatched to BullMQ.`
          });

          // Dispatch to BullMQ command queue
          const queueResult = await addCommandJob({
            automationId: auto.automationId,
            userId: auto.userId,
            command: auto.originalCommand || sched.command,
            inputType: auto.inputType || 'text',
            plan: {
              intent: auto.intent,
              channel: auto.channel,
              recipient: auto.recipient,
              recipients: auto.recipient?.recipients || [auto.recipient?.email],
              subject: auto.generatedContent?.subject,
              message: auto.generatedContent?.body,
              schedule: auto.schedule
            }
          });

          if (queueResult.success) {
            sched.status = 'PROCESSING';
            await sched.save();
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler Error]:', err.message);
    }
  });
};

module.exports = { initScheduler };
