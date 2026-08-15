const Automation = require('../models/Automation');
const Schedule = require('../models/Schedule');
const ActivityLog = require('../models/ActivityLog');
const groqService = require('../services/groqService');
const n8nService = require('../services/n8nService');

const generateAutomationId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AUTO-${year}-${rand}`;
};

/**
 * Main Command Execution Endpoint
 * POST /api/automations
 */
const createAutomationFromCommand = async (req, res) => {
  try {
    const { command, inputType = 'text' } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid command.' });
    }

    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';

    // 1. Process Command via Groq AI
    const aiParsed = await groqService.processCommand(command);
    const aiTokenUsage = Number(aiParsed?.tokenUsage?.total_tokens || aiParsed?.tokenUsage || 0) || 0;

    const automationId = generateAutomationId();
    const isScheduled = aiParsed.schedule && aiParsed.schedule.isScheduled;

    // 2. Parse Scheduled Execution Time if applicable
    let calculatedExecutionTime = null;
    if (isScheduled) {
      const now = new Date();
      calculatedExecutionTime = new Date(now);
      const lowerDate = (aiParsed.schedule.date || '').toLowerCase();
      const lowerTime = (aiParsed.schedule.time || '').toLowerCase();

      if (lowerDate.includes('tomorrow') || lowerDate.includes('naalaikku')) {
        calculatedExecutionTime.setDate(calculatedExecutionTime.getDate() + 1);
      }
      let hours = 9;
      if (lowerTime.includes('pm') || lowerTime.includes('night') || lowerTime.includes('evening')) {
        const match = lowerTime.match(/(\d+)/);
        if (match) hours = (parseInt(match[1], 10) % 12) + 12;
      } else if (lowerTime.match(/(\d+)/)) {
        const match = lowerTime.match(/(\d+)/);
        if (match) hours = parseInt(match[1], 10);
      }
      calculatedExecutionTime.setHours(hours, 0, 0, 0);
      if (calculatedExecutionTime <= now) {
        calculatedExecutionTime.setDate(calculatedExecutionTime.getDate() + 1);
      }
    }

    const initialStatus = isScheduled ? 'SCHEDULED' : 'PROCESSING';

    // 3. Save Automation in DB
    const automation = await Automation.create({
      automationId,
      userId,
      originalCommand: command,
      language: aiParsed.language || 'english',
      inputType,
      intent: aiParsed.intent || (aiParsed.channel === 'gmail' ? 'send_email' : 'send_message'),
      channel: aiParsed.channel || 'gmail',
      recipient: {
        name: aiParsed.recipient?.name || 'Recipient',
        email: aiParsed.recipient?.email || '',
        telegramId: aiParsed.recipient?.chatId || ''
      },
      generatedContent: {
        subject: aiParsed.subject || '',
        body: aiParsed.content || ''
      },
      schedule: {
        date: aiParsed.schedule?.date || null,
        time: aiParsed.schedule?.time || null,
        cron: null,
        nextExecution: isScheduled ? calculatedExecutionTime : null
      },
      aiTokenUsage,
      responseTimeMs: 0,
      status: initialStatus
    });

    // 4. If Scheduled: Save Schedule record and return
    if (isScheduled) {
      await Schedule.create({
        userId,
        automationId,
        command,
        scheduleDetails: {
          date: aiParsed.schedule?.date,
          time: aiParsed.schedule?.time
        },
        nextExecution: calculatedExecutionTime,
        status: 'SCHEDULED'
      });

      await ActivityLog.create({
        userId,
        automationId,
        action: 'SCHEDULE_AUTOMATION',
        channel: aiParsed.channel,
        status: 'SCHEDULED',
        message: `Scheduled automation set for ${calculatedExecutionTime.toLocaleString()}`
      });

      return res.status(201).json({
        success: true,
        message: 'Automation scheduled successfully.',
        data: automation
      });
    }

    // 5. If Immediate: Call n8n Webhook now
    await ActivityLog.create({
      userId,
      automationId,
      action: `TRIGGER_WORKFLOW_${aiParsed.channel.toUpperCase()}`,
      channel: aiParsed.channel,
      status: 'PROCESSING',
      message: `Dispatching ${aiParsed.intent} request to n8n webhook`
    });

    const n8nResult = await n8nService.triggerWorkflow({
      automationId,
      userId: userId.toString(),
      intent: aiParsed.intent,
      channel: aiParsed.channel,
      recipient: aiParsed.recipient,
      subject: aiParsed.subject,
      content: aiParsed.content,
      language: aiParsed.language
    });

    if (n8nResult.success) {
      automation.status = 'SUCCESS';
      automation.n8nExecutionId = n8nResult.n8nExecutionId;
      automation.completedAt = new Date();
      automation.responseTimeMs = Math.max(0, automation.completedAt.getTime() - new Date(automation.executedAt).getTime());
      await automation.save();

      await ActivityLog.create({
        userId,
        automationId,
        action: `WORKFLOW_COMPLETED_${aiParsed.channel.toUpperCase()}`,
        channel: aiParsed.channel,
        status: 'SUCCESS',
        message: `n8n execution successful (${n8nResult.n8nExecutionId})`
      });

      return res.status(201).json({
        success: true,
        message: 'Automation executed successfully via n8n.',
        data: automation
      });
    } else {
      automation.status = 'FAILED';
      automation.error = n8nResult.error;
      automation.completedAt = new Date();
      automation.responseTimeMs = Math.max(0, automation.completedAt.getTime() - new Date(automation.executedAt).getTime());
      await automation.save();

      await ActivityLog.create({
        userId,
        automationId,
        action: `WORKFLOW_FAILED_${aiParsed.channel.toUpperCase()}`,
        channel: aiParsed.channel,
        status: 'FAILED',
        message: `n8n execution failed: ${n8nResult.error}`
      });

      return res.status(201).json({
        success: false,
        message: `Automation execution failed: ${n8nResult.error}`,
        data: automation
      });
    }
  } catch (err) {
    console.error('[Create Automation Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAutomations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const automations = await Automation.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, count: automations.length, data: automations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAutomationById = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const automation = await Automation.findOne({
      automationId: req.params.id,
      userId
    });
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation record not found.' });
    }

    const logs = await ActivityLog.find({ automationId: req.params.id }).sort({ timestamp: 1 });
    res.json({ success: true, data: automation, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getLogs = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const logs = await ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAutomation = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    await Automation.deleteOne({ automationId: req.params.id, userId });
    res.json({ success: true, message: 'Automation record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createAutomationFromCommand,
  getAutomations,
  getAutomationById,
  getLogs,
  deleteAutomation
};
