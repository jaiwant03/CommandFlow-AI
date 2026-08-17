const axios = require('axios');
const ActivityLog = require('../models/ActivityLog');
const Automation = require('../models/Automation');

/**
 * n8n Orchestration Service & Webhook Trigger
 */
class N8nService {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || 'n8n_sec_commandflow_2026';
  }

  /**
   * Dispatch payload to published n8n webhook (/webhook/commandflow)
   */
  async triggerWorkflow(payload) {
    const { automationId, userId, channel, intent, recipient, subject, content, language, recipients, htmlContent, attachments } = payload;
    const webhookUrl = `${this.baseUrl}/webhook/commandflow`;

    const recipientsList = recipients && recipients.length > 0
      ? recipients
      : (recipient?.email ? [recipient.email] : []);

    const recipientsString = recipientsList.join(', ');

    // Construct n8n payload according to specification
    let n8nPayload = {};
    if (channel === 'gmail') {
      n8nPayload = {
        automationId,
        intent: intent || 'send_email',
        channel: 'gmail',
        recipient: {
          name: recipient?.name || 'Recipient',
          email: recipientsString || recipient?.email || '',
          recipients: recipientsList
        },
        recipients: recipientsList,
        toEmail: recipientsString,
        to: recipientsString,
        subject: subject || 'CommandFlow Message',
        content: htmlContent || content || 'Hello from CommandFlow AI',
        htmlContent: htmlContent || content,
        attachments: attachments || [],
        language: language || 'english'
      };
    } else {
      n8nPayload = {
        automationId,
        intent: intent || 'send_message',
        channel: 'telegram',
        recipient: {
          chatId: recipient?.chatId || recipient?.telegramId || '7793673257'
        },
        content: content || 'Hello from CommandFlow AI Telegram Bot',
        language: language || 'english'
      };
    }

    console.log(`[n8n Engine] Dispatching webhook to ${webhookUrl}...`);
    console.log(`[n8n Engine] Payload:`, JSON.stringify(n8nPayload, null, 2));

    try {
      const response = await axios.post(
        webhookUrl,
        n8nPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-n8n-webhook-secret': this.webhookSecret
          },
          timeout: 10000
        }
      );

      console.log(`[n8n Engine] Webhook response received successfully. Status: ${response.status}`);

      return {
        success: true,
        n8nExecutionId: response.data?.executionId || response.data?.id || `n8n-exec-${Date.now()}`,
        responseData: response.data
      };
    } catch (error) {
      const errorMsg = error.response
        ? `n8n Webhook returned ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : `n8n Webhook connection failed: ${error.message}`;

      console.error(`[n8n Engine Error]: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg
      };
    }
  }
}

module.exports = new N8nService();
