const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/env');
const emailService = require('./emailService');
const telegramService = require('./telegramService');

/**
 * n8n Orchestration Service & Webhook Trigger with Fallback Execution
 */
class N8nService {
  constructor() {
    this.baseUrl = config.n8nBaseUrl;
    this.webhookSecret = config.n8nWebhookSecret;
  }

  /**
   * Dispatch payload to n8n webhook (/webhook/commandflow or /webhook-test/commandflow)
   * If n8n is unavailable or returns 404/error, fallback gracefully to direct SMTP / Telegram delivery.
   */
  async triggerWorkflow(payload) {
    const {
      automationId,
      userCommand,
      userId,
      channel,
      intent,
      recipient,
      subject,
      message,
      content,
      language,
      recipients,
      htmlContent,
      attachments
    } = payload;

    const recipientsList = recipients && recipients.length > 0
      ? recipients
      : (recipient?.email ? [recipient.email] : []);

    const hasBinaryAttachments = Array.isArray(attachments) &&
      attachments.length > 0 &&
      attachments.some(att => att.buffer || att.data || att.url || att.file);
    const isAttachmentPresent = Boolean(hasBinaryAttachments);

    // Construct n8n payload according to specification
    let n8nPayload = {};
    if (channel === 'gmail') {
      const primaryEmail = recipientsList[0] || recipient?.email || '';
      n8nPayload = {
        automationId,
        userCommand: userCommand || '',
        intent: intent || 'send_email',
        channel: 'gmail',
        hasAttachment: isAttachmentPresent,
        recipient: {
          name: recipient?.name || 'Recipient',
          email: primaryEmail,
          recipients: recipientsList
        },
        recipientEmail: primaryEmail,
        recipients: recipientsList,
        toEmail: primaryEmail,
        to: primaryEmail,
        subject: subject || '',
        message: htmlContent || message || content || '',
        content: message || content || '',
        htmlContent: htmlContent || message || content || '',
        attachments: attachments || [],
        language: language || 'english'
      };
    } else {
      const chatId = recipient?.chatId || recipient?.telegramId || config.telegramDefaultChatId;
      n8nPayload = {
        automationId,
        userCommand: userCommand || '',
        intent: intent || 'send_message',
        channel: 'telegram',
        hasAttachment: isAttachmentPresent,
        recipient: {
          chatId
        },
        recipients: [chatId],
        message: message || content || '',
        content: message || content || '',
        language: language || 'english'
      };
    }

    let requestPayload = n8nPayload;
    let requestHeaders = {
      'Content-Type': 'application/json',
      'x-n8n-webhook-secret': this.webhookSecret
    };

    if (hasBinaryAttachments) {
      const form = new FormData();
      Object.keys(n8nPayload).forEach(key => {
        if (typeof n8nPayload[key] === 'object') {
          form.append(key, JSON.stringify(n8nPayload[key]));
        } else {
          form.append(key, String(n8nPayload[key] || ''));
        }
      });

      attachments.forEach((att, idx) => {
        let fileBuffer = null;
        if (Buffer.isBuffer(att.buffer)) {
          fileBuffer = att.buffer;
        } else if (typeof att.data === 'string') {
          if (att.data.includes(';base64,')) {
            const parts = att.data.split(';base64,');
            fileBuffer = Buffer.from(parts[1], 'base64');
          } else {
            fileBuffer = Buffer.from(att.data, 'base64');
          }
        }

        if (fileBuffer) {
          form.append('data', fileBuffer, {
            filename: att.filename || `attachment_${idx + 1}.png`,
            contentType: att.contentType || 'image/png'
          });
        }
      });

      requestPayload = form;
      requestHeaders = {
        ...form.getHeaders(),
        'x-n8n-webhook-secret': this.webhookSecret
      };
    }

    // List of webhook endpoints to try
    const webhookUrls = channel === 'gmail'
      ? [`${this.baseUrl}/webhook/commandflow`, `${this.baseUrl}/webhook/send-gmail`, `${this.baseUrl}/webhook-test/commandflow`]
      : [`${this.baseUrl}/webhook/commandflow`, `${this.baseUrl}/webhook/send-telegram`, `${this.baseUrl}/webhook-test/commandflow`];

    // Attempt dispatch via n8n first
    for (const webhookUrl of webhookUrls) {
      try {
        console.log(`[n8n Engine] Attempting dispatch to ${webhookUrl}...`);
        const response = await axios.post(
          webhookUrl,
          requestPayload,
          {
            headers: requestHeaders,
            timeout: 10000
          }
        );

        console.log(`[n8n Engine] Webhook response received from ${webhookUrl}. Status: ${response.status}`);
        return {
          success: true,
          n8nExecutionId: response.data?.executionId || response.data?.id || `n8n-exec-${Date.now()}`,
          responseData: response.data,
          via: 'n8n'
        };
      } catch (err) {
        const status = err.response ? err.response.status : (err.code === 'ECONNABORTED' ? 'TIMEOUT' : err.message);
        console.warn(`[n8n Engine] Webhook at ${webhookUrl} returned ${status}.`);
      }
    }

    // Direct Guaranteed Delivery Fallback (SMTP for Gmail, Bot API for Telegram)
    if (channel === 'gmail') {
      try {
        const targetRecipients = recipientsList.length > 0
          ? recipientsList
          : [recipient?.email].filter(Boolean);

        console.log(`[SMTP Engine] Direct delivery to: ${targetRecipients.join(', ')}...`);
        const emailResult = await emailService.sendEmail({
          to: targetRecipients,
          subject: subject || 'CommandFlow Message',
          content: message || content || '',
          htmlContent: htmlContent || message || content || '',
          attachments: attachments || []
        });

        return {
          success: true,
          n8nExecutionId: emailResult.messageId || `direct-smtp-${Date.now()}`,
          responseData: emailResult,
          via: 'direct_email'
        };
      } catch (emailErr) {
        console.error(`[SMTP Engine Error]: ${emailErr.message}`);
        return {
          success: false,
          error: `Gmail delivery failed: ${emailErr.message}`
        };
      }
    }

    if (channel === 'telegram') {
      try {
        const targetChatId = recipient?.chatId || recipient?.telegramId || config.telegramDefaultChatId;
        console.log(`[Telegram Engine] Direct delivery to chat ID: ${targetChatId}...`);
        const tgResult = await telegramService.sendMessage({
          chatId: targetChatId,
          text: message || content || ''
        });

        return {
          success: true,
          n8nExecutionId: tgResult.messageId || `telegram-msg-${Date.now()}`,
          responseData: tgResult,
          via: 'direct_telegram'
        };
      } catch (tgErr) {
        console.error(`[Telegram Engine Error]: ${tgErr.message}`);
        return {
          success: false,
          error: `Telegram delivery failed: ${tgErr.message}`
        };
      }
    }

    return {
      success: false,
      error: `Unsupported execution channel: ${channel}`
    };
  }
}

module.exports = new N8nService();
