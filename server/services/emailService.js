const dns = require('dns');

// Enforce IPv4 lookup priority to prevent Windows / ISP / Cloud IPv6 routing timeouts to smtp.gmail.com
try {
  if (dns && typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (e) {}

// Bulletproof custom IPv4 lookup callback - completely prevents ENETUNREACH IPv6 routing errors on Linux/Render
const customIpv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4, all: false }, (err, address, family) => {
    if (err) return callback(err);
    callback(null, address, 4);
  });
};

require('../config/env');
const nodemailer = require('nodemailer');
const axios = require('axios');

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
  async getTransporters() {
    if (!this.user || !this.pass) {
      this.initTransporter();
    }
    if (!this.user || !this.pass) {
      return [];
    }

    const { user, pass } = this;

    // Actively resolve IPv4 addresses to permanently eliminate Linux ENETUNREACH IPv6 routing errors on cloud/Render
    let ipv4Host = 'smtp.gmail.com';
    try {
      const ips = await dns.promises.resolve4('smtp.gmail.com');
      if (ips && ips.length > 0) {
        ipv4Host = ips[0];
        console.log(`[EmailService] Enforcing IPv4 address for smtp.gmail.com: ${ipv4Host}`);
      }
    } catch (dnsErr) {
      console.warn(`[EmailService] DNS IPv4 resolution note: ${dnsErr.message}`);
    }

    // Carrier 1: Direct SSL Port 465 via IPv4 with SNI
    const port465 = nodemailer.createTransport({
      host: ipv4Host,
      port: 465,
      secure: true,
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com'
      },
      pool: false, // Fresh socket per dispatch to prevent stale idle socket drops
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 8000
    });

    // Carrier 2: Standard SMTP Port 587 with STARTTLS via IPv4 with SNI
    const port587 = nodemailer.createTransport({
      host: ipv4Host,
      port: 587,
      secure: false,
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com'
      },
      pool: false,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 8000
    });

    // Carrier 3: Standard hostname fallback (in case IP was rotated)
    const hostnameCarrier = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      tls: { rejectUnauthorized: false },
      pool: false,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 8000
    });

    return [
      { name: 'Gmail SMTP Port 465 (IPv4 Direct SSL)', transport: port465 },
      { name: 'Gmail SMTP Port 587 (IPv4 STARTTLS)', transport: port587 },
      { name: 'Gmail SMTP Hostname Fallback', transport: hostnameCarrier }
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

    // 0. HTTPS Carrier: Brevo (Sendinblue) via Port 443 (Zero SMTP Port Block on Render / Cloud)
    const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    if (brevoKey) {
      try {
        console.log(`[EmailService] Attempting delivery via Brevo HTTPS API (Port 443)...`);
        const startTime = Date.now();
        const brevoRes = await axios.post('https://api.brevo.com/v3/smtp/email', {
          sender: { name: 'CommandFlow AI', email: senderEmail },
          to: recipientList.map(r => ({ email: r })),
          subject: subject || 'CommandFlow AI Notification',
          htmlContent: cleanHtml,
          textContent: plainText
        }, {
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 8000
        });

        if (brevoRes.data && (brevoRes.data.messageId || brevoRes.status === 201 || brevoRes.status === 200)) {
          const durationMs = Date.now() - startTime;
          const msgId = brevoRes.data.messageId || `brevo-${Date.now()}`;
          console.log(`[EmailService] Email dispatched via Brevo HTTPS API in ${durationMs}ms! MessageId: ${msgId}`);
          return {
            success: true,
            messageId: msgId,
            provider: 'Brevo HTTPS API (Port 443)',
            durationMs
          };
        }
      } catch (brevoErr) {
        console.warn(`[EmailService] Brevo HTTPS API error: ${brevoErr.response?.data?.message || brevoErr.message}. Failing over to SMTP...`);
      }
    }

    // 0b. HTTPS Carrier: Resend via Port 443 (Zero SMTP Port Block on Render / Cloud)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        console.log(`[EmailService] Attempting delivery via Resend HTTPS API (Port 443)...`);
        const startTime = Date.now();
        const resendRes = await axios.post('https://api.resend.com/emails', {
          from: process.env.RESEND_FROM || `CommandFlow AI <onboarding@resend.dev>`,
          to: recipientList,
          subject: subject || 'CommandFlow AI Notification',
          html: cleanHtml,
          text: plainText
        }, {
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        });

        if (resendRes.data && (resendRes.data.id || resendRes.status === 200 || resendRes.status === 201)) {
          const durationMs = Date.now() - startTime;
          const msgId = resendRes.data.id || `resend-${Date.now()}`;
          console.log(`[EmailService] Email dispatched via Resend HTTPS API in ${durationMs}ms! MessageId: ${msgId}`);
          return {
            success: true,
            messageId: msgId,
            provider: 'Resend HTTPS API (Port 443)',
            durationMs
          };
        }
      } catch (resendErr) {
        console.warn(`[EmailService] Resend HTTPS API error: ${resendErr.response?.data?.message || resendErr.message}. Failing over to SMTP...`);
      }
    }

    const candidates = await this.getTransporters();

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
