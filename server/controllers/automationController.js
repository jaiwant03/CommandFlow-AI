const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const commandService = require('../services/commandService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const AppError = require('../utils/appError');

/**
 * Main Command Execution Endpoint
 * POST /api/automations
 */
const createAutomationFromCommand = async (req, res, next) => {
  try {
    let { command, inputType = 'text', attachments: rawAttachments, idempotencyKey } = req.body;

    if (!command || !command.trim()) {
      return sendError(res, 'Please provide a valid command.', 400, 'EMPTY_COMMAND');
    }

    let parsedAttachments = [];
    if (typeof rawAttachments === 'string') {
      try {
        parsedAttachments = JSON.parse(rawAttachments);
      } catch (e) {
        parsedAttachments = [];
      }
    } else if (Array.isArray(rawAttachments)) {
      parsedAttachments = rawAttachments;
    }

    const combinedAttachments = [...parsedAttachments];

    if (req.files) {
      let uploadedFileList = [];
      if (Array.isArray(req.files)) {
        uploadedFileList = req.files;
      } else if (typeof req.files === 'object') {
        uploadedFileList = [
          ...(req.files.image || []),
          ...(req.files.file || []),
          ...(req.files.attachments || []),
          ...(req.files.data || [])
        ];
      }

      for (const file of uploadedFileList) {
        const base64Data = file.buffer ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : '';
        combinedAttachments.push({
          filename: file.originalname || file.name || 'attachment.png',
          contentType: file.mimetype || 'image/png',
          data: base64Data,
          buffer: file.buffer,
          size: file.size || 0
        });
      }
    }

    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';

    // Process, validate, persist and enqueue into BullMQ
    const result = await commandService.processAndEnqueueCommand({
      userId,
      command,
      inputType,
      attachments: combinedAttachments,
      idempotencyKey
    });

    const statusMessage = result.isScheduled
      ? 'Automation scheduled successfully.'
      : 'Command accepted and queued for execution.';

    return sendSuccess(res, statusMessage, result.automation, 201);
  } catch (err) {
    next(err);
  }
};

const getAutomations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const automations = await Automation.find({ userId }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Automations retrieved successfully.', automations, 200, { count: automations.length });
  } catch (err) {
    next(err);
  }
};

const getAutomationById = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const automation = await Automation.findOne({
      automationId: req.params.id,
      userId
    });

    if (!automation) {
      return sendError(res, 'Automation record not found.', 404, 'NOT_FOUND');
    }

    const logs = await ActivityLog.find({ automationId: req.params.id }).sort({ timestamp: 1 });
    return res.json({ success: true, data: automation, logs });
  } catch (err) {
    next(err);
  }
};

const retryAutomation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const retried = await commandService.retryCommand(userId, req.params.id);
    return sendSuccess(res, 'Command re-queued for execution.', retried);
  } catch (err) {
    next(err);
  }
};

const cancelAutomation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const cancelled = await commandService.cancelCommand(userId, req.params.id);
    return sendSuccess(res, 'Automation cancelled successfully.', cancelled);
  } catch (err) {
    next(err);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const logs = await ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(100);
    return sendSuccess(res, 'Logs retrieved.', logs, 200, { count: logs.length });
  } catch (err) {
    next(err);
  }
};

const deleteAutomation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    await Automation.deleteOne({ automationId: req.params.id, userId });
    return sendSuccess(res, 'Automation record deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createAutomationFromCommand,
  getAutomations,
  getAutomationById,
  retryAutomation,
  cancelAutomation,
  getLogs,
  deleteAutomation
};
