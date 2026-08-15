const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');

/**
 * Handle Webhook Callbacks from n8n Orchestration Workflows
 */
const handleN8nCallback = async (req, res) => {
  try {
    const { automationId, status, channel, messageId, executedAt, error } = req.body;

    if (!automationId) {
      return res.status(400).json({ success: false, message: 'automationId is required in n8n callback payload.' });
    }

    const automation = await Automation.findOne({ automationId });
    if (!automation) {
      return res.status(404).json({ success: false, message: 'Automation not found for callback.' });
    }

    const finalStatus = status === 'success' || status === 'Success' ? 'Success' : 'Failed';

    automation.status = finalStatus;
    automation.completedAt = new Date();
    if (error) {
      automation.error = error;
    }
    await automation.save();

    // Log Activity
    await ActivityLog.create({
      userId: automation.userId,
      automationId,
      action: `N8N_CALLBACK_${finalStatus.toUpperCase()}`,
      channel: channel || automation.channel,
      status: finalStatus,
      message: error ? `n8n execution failed: ${error}` : `n8n workflow completed successfully. Message ID: ${messageId || 'N/A'}`
    });

    res.json({
      success: true,
      message: 'n8n callback processed and MongoDB updated.',
      automationId,
      status: finalStatus
    });

  } catch (err) {
    console.error('[n8n Callback Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  handleN8nCallback
};
