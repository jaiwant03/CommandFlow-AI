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

    // 1. Cloud-Optimized Delivery: When N8N_BASE_URL is an HTTPS cloud URL, dispatch to n8n first
    const hasCloudN8n = this.baseUrl && this.baseUrl.startsWith('https://');

    if (channel === 'gmail' && hasCloudN8n) {
      console.log(`[n8n Engine] Cloud environment detected. Dispatching Gmail payload to n8n at ${this.baseUrl}...`);
      const webhookUrls = [
        `${this.baseUrl}/webhook/commandflow`,
        `${this.baseUrl}/webhook-test/commandflow`
      ];

      for (const webhookUrl of webhookUrls) {
        try {
          const n8nRes = await axios.post(webhookUrl, requestPayload, {
            headers: requestHeaders,
            timeout: 15000
          });
          if (n8nRes.data && (n8nRes.status === 200 || n8nRes.status === 201)) {
            console.log(`[n8n Engine] Real Gmail dispatched via n8n webhook ${webhookUrl}!`);
            return {
              success: true,
              n8nExecutionId: n8nRes.data?.executionId || n8nRes.data?.id || `n8n-gmail-${Date.now()}`,
              responseData: n8nRes.data,
              via: 'n8n'
            };
          }
        } catch (n8nErr) {
          const status = n8nErr.response ? n8nErr.response.status : n8nErr.message;
          console.warn(`[n8n Engine] Webhook at ${webhookUrl} note: ${status}.`);
        }
      }
    }

    // Direct Guaranteed Delivery via Gmail SMTP Engine (for Localhost / unblocked environments)
    if (channel === 'gmail') {
      try {
        const targetRecipients = recipientsList.length > 0
          ? recipientsList
          : [recipient?.email, config.defaultRecipientEmail, 'admin.jaiwant@gmail.com'].filter(Boolean);

        console.log(`[SMTP Engine] Direct delivery to: ${targetRecipients.join(', ')}...`);
        const emailResult = await emailService.sendEmail({
          to: targetRecipients,
          subject: subject || 'CommandFlow Notification',
          content: message || content || '',
          htmlContent: htmlContent || message || content || '',
          attachments: attachments || []
        });

        if (!emailResult || !emailResult.success) {
          throw new Error('Gmail delivery could not be verified.');
        }

        console.log(`[SMTP Engine] Successfully processed email to ${targetRecipients.join(', ')}. MessageId: ${emailResult.messageId}`);

        // Asynchronously notify n8n webhook for workflow logging and auditing (non-blocking)
        const n8nWebhookUrl = `${this.baseUrl}/webhook/commandflow`;
        const auditPayload = typeof requestPayload === 'object' && !hasBinaryAttachments
          ? { ...requestPayload, channel: 'smtp_direct', deliveredVia: 'gmail_smtp' }
          : requestPayload;
        axios.post(n8nWebhookUrl, auditPayload, { headers: requestHeaders, timeout: 5000 })
          .then((res) => console.log(`[n8n Engine] Audit event logged to n8n. Status: ${res.status}`))
          .catch((err) => console.warn(`[n8n Engine] Audit notification note: ${err.message}`));

        return {
          success: true,
          n8nExecutionId: emailResult.messageId || `direct-smtp-${Date.now()}`,
          responseData: emailResult,
          via: 'direct_email'
        };
      } catch (emailErr) {
        console.error(`[SMTP Engine Error]: ${emailErr.message}`);

        // Failover attempt to n8n webhook if direct SMTP had an issue
        try {
          const isLocalhostOnCloud = (process.env.RENDER === 'true' || config.env === 'production') && this.baseUrl.includes('localhost:5678');
          if (isLocalhostOnCloud) {
            console.warn(`[n8n Engine] Notice: N8N_BASE_URL is set to localhost:5678 on Render. Set N8N_BASE_URL to your Render n8n service URL (e.g. https://<your-n8n>.onrender.com) in Render Dashboard.`);
          } else {
            console.log(`[n8n Engine] Attempting n8n webhook failover for Gmail (${this.baseUrl}/webhook/commandflow)...`);
            const n8nRes = await axios.post(`${this.baseUrl}/webhook/commandflow`, requestPayload, {
              headers: requestHeaders,
              timeout: 12000
            });
            if (n8nRes.data && (n8nRes.status === 200 || n8nRes.status === 201)) {
              return {
                success: true,
                n8nExecutionId: n8nRes.data?.executionId || `n8n-smtp-${Date.now()}`,
                responseData: n8nRes.data,
                via: 'n8n'
              };
            }
          }
        } catch (n8nErr) {
          console.warn(`[n8n Engine] n8n failover note: ${n8nErr.message}`);
        }

        let errMsg = emailErr.message.startsWith('Gmail delivery failed:')
          ? emailErr.message
          : `Gmail delivery failed: ${emailErr.message}`;

        if (errMsg.includes('Connection timeout') || errMsg.includes('ETIMEDOUT')) {
          errMsg = `Gmail delivery timed out: Render Free tier blocks outbound SMTP ports 465/587. Add BREVO_API_KEY / RESEND_API_KEY (Port 443 HTTPS) in Render Dashboard or point mobile app to local server in Settings.`;
        } else if (errMsg.includes('ENETUNREACH')) {
          errMsg = `Gmail network unreachable (ENETUNREACH): Cloud provider lacks IPv6 routing or blocks outbound SMTP ports. Resolving via IPv4 or adding BREVO_API_KEY / RESEND_API_KEY (Port 443 HTTPS) ensures instant cloud delivery.`;
        }

        return {
          success: false,
          error: errMsg
        };
      }
    }

    // 2. Telegram Delivery Pipeline (n8n Webhook with Bot API Direct Fallback)
    if (channel === 'telegram') {
      const webhookUrls = [
        `${this.baseUrl}/webhook/commandflow`,
        `${this.baseUrl}/webhook/send-telegram`,
        `${this.baseUrl}/webhook-test/commandflow`
      ];

      for (const webhookUrl of webhookUrls) {
        try {
          console.log(`[n8n Engine] Attempting Telegram dispatch to ${webhookUrl}...`);
          const response = await axios.post(webhookUrl, requestPayload, {
            headers: requestHeaders,
            timeout: 3000
          });

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

      // Telegram Direct Bot API Fallback
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
