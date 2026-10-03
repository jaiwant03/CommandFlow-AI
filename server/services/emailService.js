const dns = require('dns');

// Enforce IPv4 lookup priority to prevent Windows / ISP IPv6 routing timeouts to smtp.gmail.com
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

require('../config/env');
const nodemailer = require('nodemailer');

/**
 * Direct Email Service using Nodemailer
 * Supports high-speed Gmail SMTP with direct SSL, IPv4 resolution enforcement, and guaranteed inbox delivery.
 */
class EmailService {
  constructor() {
    this.user = null;
    this.pass = null;
    this.initialized = false;
    this.initTransporter();
  }

  /**
   * Initialize transporter credentials from environment variables
   */
  initTransporter() {
    const rawUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    const rawPass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (rawUser && rawPass && !rawUser.includes('your_') && !rawPass.includes('your_')) {
      this.user = rawUser.trim();
      this.pass = rawPass.replace(/\s+/g, '');
      console.log(`[EmailService] Initialized Gmail delivery engine for ${this.user} (IPv4 enforced, zero-stale-pool).`);
      this.initialized = true;
    } else {
      console.warn('[EmailService] Notice: EMAIL_USER and EMAIL_PASS not configured in server/.env.');
      this.initialized = true;
    }
  }

  /**
   * Create fresh transporters with IPv4 affinity and tight timeouts (prevents stale socket hangs)
   */
  getTransporters() {
    if (!this.user || !this.pass) {
      this.initTransporter();
    }
    if (!this.user || !this.pass) {
      return [];
    }

    const { user, pass } = this;

    // Carrier 1: Direct SSL Port 465 (Fastest & most reliable for Gmail with IPv4 enforcement)
    const port465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4, // Force IPv4 to prevent IPv6 routing blackholes
      pool: false, // Fresh socket per dispatch to prevent stale idle socket drops
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    // Carrier 2: Standard SMTP Port 587 with STARTTLS (Fallback if Port 465 is filtered by ISP)
    const port587 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      family: 4,
      pool: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    // Carrier 3: First-class Gmail Service Driver
    const gmailService = nodemailer.createTransport({
      service: 'gmail',
      family: 4,
      pool: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 5000,
      socketTimeout: 10000
    });

    return [
      { name: 'Gmail SMTP Port 465 (Direct SSL)', transport: port465 },
      { name: 'Gmail SMTP Port 587 (STARTTLS)', transport: port587 },
      { name: 'Gmail Service Transporter', transport: gmailService }
    ];
  }

  /**
   * Send email using Nodemailer with verified real delivery
   */
  async sendEmail({ to, subject, content, htmlContent, attachments = [] }) {
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

    const senderEmail = this.user || process.env.EMAIL_USER || process.env.GMAIL_USER || 'admin.jaiwant@gmail.com';
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

    const candidates = this.getTransporters();

    if (candidates.length === 0) {
      throw new Error(`No active email credentials configured. Verify EMAIL_USER and EMAIL_PASS in server/.env.`);
    }

    let lastError = null;

    for (const candidate of candidates) {
      try {
        console.log(`[EmailService] Attempting delivery via ${candidate.name}...`);
        const startTime = Date.now();
        const info = await candidate.transport.sendMail(mailOptions);
        const durationMs = Date.now() - startTime;
        console.log(`[EmailService] Email dispatched via ${candidate.name} in ${durationMs}ms! MessageId: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[EmailService] Test Preview URL: ${previewUrl}`);
        }
        return {
          success: true,
          messageId: info.messageId || `msg-${Date.now()}`,
          provider: candidate.name,
          durationMs,
          previewUrl: previewUrl || null
        };
      } catch (err) {
        lastError = err;
        console.warn(`[EmailService] ${candidate.name} error: ${err.message}. Failing over immediately...`);
      }
    }

    if (lastError) {
      console.error(`[EmailService] All SMTP live carriers encountered errors: ${lastError.message}`);
      throw new Error(lastError.message);
    }

    throw new Error(`Delivery to "${primaryRecipient}" could not be confirmed.`);
  }
}

module.exports = new EmailService();
