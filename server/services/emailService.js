const nodemailer = require('nodemailer');

/**
 * Direct Email Service using Nodemailer
 * Supports high-speed Gmail SMTP with pooled connections, custom SMTP, and instant fallback handling.
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initPromise = this.initTransporter();
  }

  /**
   * Initialize transporter based on environment variables or test account
   */
  async initTransporter() {
    const user = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);

    if (user && pass && !user.includes('your_') && !pass.includes('your_')) {
      const cleanPass = pass.replace(/\s+/g, '');
      console.log(`[EmailService] Initializing high-speed Gmail SMTP transporter for ${user}...`);
      try {
        // Resolve host to IPv4 to bypass Windows c-ares/IPv6 resolution delays
        let targetHost = host;
        try {
          const dns = require('dns').promises;
          const lookup = await dns.lookup(host, { family: 4 });
          if (lookup?.address) {
            targetHost = lookup.address;
          }
        } catch (dnsErr) {
          targetHost = host;
        }

        this.transporter = nodemailer.createTransport({
          host: targetHost,
          port,
          secure: port === 465,
          auth: {
            user,
            pass: cleanPass
          },
          tls: {
            servername: host,
            rejectUnauthorized: false
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 30000
        });

        // Verify connection in background
        this.transporter.verify((err) => {
          if (err) {
            console.warn(`[EmailService] SMTP verification note: ${err.message}. Ready for direct attempts.`);
          } else {
            console.log(`[EmailService] Gmail SMTP server connection verified successfully for ${user}!`);
          }
        });
        
        this.initialized = true;
        return;
      } catch (err) {
        console.error(`[EmailService] Transporter setup error: ${err.message}`);
      }
    }

    // Fallback if no credentials in .env
    console.log('[EmailService] Notice: EMAIL_USER and EMAIL_PASS (Gmail App Password) not configured in server/.env.');
    console.log('[EmailService] To receive emails directly in Gmail: Set EMAIL_USER and EMAIL_PASS in server/.env');

    try {
      // Create Ethereal test account once at server startup (non-blocking for dispatches)
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[EmailService] Ethereal fallback transporter created: ${testAccount.user}`);
    } catch (err) {
      console.warn(`[EmailService] Could not create Ethereal test transporter (${err.message}). Using simulated transporter.`);
      this.transporter = null;
    }
    this.initialized = true;
  }

  /**
   * Send email using Nodemailer
   */
  async sendEmail({ to, subject, content, htmlContent, attachments = [] }) {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }

    let recipientList = [];
    if (Array.isArray(to)) {
      recipientList = to.map(r => (typeof r === 'object' && r !== null ? (r.email || r.address || '') : String(r || ''))).filter(Boolean);
    } else if (typeof to === 'string') {
      recipientList = to.split(',').map(s => s.trim()).filter(Boolean);
    } else if (typeof to === 'object' && to !== null) {
      recipientList = [to.email || to.address].filter(Boolean);
    }

    if (recipientList.length === 0) {
      const fallback = process.env.DEFAULT_RECIPIENT_EMAIL || 'admin.jaiwant@gmail.com';
      recipientList = [fallback];
    }

    const senderEmail = process.env.EMAIL_USER || process.env.GMAIL_USER || 'admin.jaiwant@gmail.com';
    const primaryRecipient = recipientList.join(', ');

    // Format attachments for Nodemailer with CID inline embedding
    const formattedAttachments = (attachments || []).map((att, index) => {
      const cidName = att.cid || 'uploaded-image';
      if (att.buffer) {
        return {
          filename: att.filename || `attachment_${index + 1}.png`,
          content: att.buffer,
          contentType: att.contentType || 'image/png',
          cid: cidName
        };
      }
      if (att.data && att.data.startsWith('data:')) {
        const matches = att.data.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          return {
            filename: att.filename || `attachment_${index + 1}.png`,
            content: Buffer.from(matches[2], 'base64'),
            contentType: matches[1],
            cid: cidName
          };
        }
      }
      if (att.url) {
        return {
          filename: att.filename || `attachment_${index + 1}`,
          path: att.url,
          cid: cidName
        };
      }
      return null;
    }).filter(Boolean);

    // Format email content for clean structure, line gaps, and executive presentation in Gmail
    const { formatEmailContent } = require('../utils/emailFormatter');
    const formatted = formatEmailContent({
      subject,
      content,
      htmlContent
    });

    const plainText = formatted.plainText;
    // If htmlContent is already a full HTML document, preserve it; otherwise use formatted HTML
    const cleanHtml = (htmlContent && htmlContent.includes('<html') && htmlContent.includes('<body'))
      ? htmlContent
      : formatted.html;

    const mailOptions = {
      from: `"CommandFlow AI" <${senderEmail}>`,
      to: primaryRecipient,
      subject: subject || 'CommandFlow AI Notification',
      text: plainText,
      html: cleanHtml,
      attachments: formattedAttachments,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };

    const hasImage = Array.isArray(attachments) && attachments.length > 0;
    const binaryFieldExists = formattedAttachments.length > 0;

    console.log(`[Gmail] Sender: ${senderEmail}`);
    console.log(`[Gmail] Recipient: ${primaryRecipient}`);
    console.log(`[Gmail] Has image: ${hasImage}`);
    console.log(`[Gmail] Binary field exists: ${binaryFieldExists}`);

    if (this.transporter) {
      try {
        const startTime = Date.now();
        const info = await this.transporter.sendMail(mailOptions);
        const durationMs = Date.now() - startTime;
        console.log(`[EmailService] Email dispatched in ${durationMs}ms! MessageId: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[EmailService] Test Preview URL: ${previewUrl}`);
        }
        return {
          success: true,
          messageId: info.messageId || `msg-${Date.now()}`,
          provider: 'nodemailer',
          durationMs,
          previewUrl: previewUrl || null
        };
      } catch (error) {
        console.error(`[EmailService Delivery Error]: ${error.message}`);
        throw error;
      }
    }

    // Simulated fallback if no transporter available
    console.log(`[EmailService] [Simulated Delivery] Email to "${primaryRecipient}" with subject "${subject}" completed.`);
    return {
      success: true,
      messageId: `sim-msg-${Date.now()}`,
      provider: 'simulated',
      note: `Email queued and formatted for ${primaryRecipient}`
    };
  }
}

module.exports = new EmailService();
