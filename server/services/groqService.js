const axios = require('axios');

/**
 * Groq AI Service for Intent Extraction, Content Generation, Multilingual Understanding
 */
class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile';
  }

  /**
   * Parse user command into structured JSON according to CommandFlow specifications
   */
  async processCommand(command, attachments = []) {
    if (!command || !command.trim()) {
      throw new Error('Command text cannot be empty.');
    }

    const systemPrompt = `You are CommandFlow AI, an intelligent personal automation assistant.

The user will provide natural-language instructions for sending emails or messages.

Your job is to:
1. Understand the user's intent (send_email for Gmail, send_message for Telegram).
2. Identify the communication channel (gmail or telegram).
3. Extract recipient information (name, email address for Gmail; chatId for Telegram). Never invent fake email addresses or Telegram chat IDs if not provided.
4. Extract scheduling information (date, time, timezone).
5. Understand the purpose and important details from the command.
6. GENERATE THE ACTUAL MESSAGE / EMAIL CONTENT. Never use the user's command itself as the final message unless the user explicitly asks to send that exact text (e.g. "Send exactly this message: ...").
7. GENERATE A SUITABLE SUBJECT for emails (e.g., "Leave Request", "Request for Bonafide Certificate", "Absence Notification", "Permission Request", "Meeting Request"). Never use generic subjects like "CommandFlow AI Test" or raw command text.
8. Preserve the user's requested meaning and reason (e.g., if user mentions attending uncle's function, include that in the letter).
9. Write professionally when the user requests letters, applications, requests, or formal communication. Include formal salutations (e.g., "Dear Sir/Madam,"), clear body paragraphs, and proper sign-offs (e.g., "Regards,\nJaiwant Karrun").
10. Respect the requested language (English, Tamil, Tanglish). If Tanglish (e.g., "Naalaikku class ku vara mudiyadhu, leave letter ah sir ku anuppu"), interpret the meaning and generate an appropriate leave request.

DISTINCTION BETWEEN COMMAND vs CONTENT:
- If user says: "Send a message to John saying I will reach at 6 PM." -> content: "I will reach at 6 PM."
- If user says: "Send a leave letter to admin@example.com through Gmail because I went to my uncle's function." -> subject: "Leave Request", content: "Dear Sir/Madam,\n\nI am writing to request leave as I had to attend my uncle's function. Due to this personal commitment, I was unable to attend class.\n\nI kindly request you to consider my absence and grant me leave.\n\nThank you for your understanding.\n\nRegards,\nJaiwant Karrun"
- If user says: "Send a bonafide certificate request to admin@example.com through Gmail." -> subject: "Request for Bonafide Certificate", content: "Dear Sir/Madam,\n\nI am writing to kindly request a bonafide certificate for official purposes. I would be grateful if you could process my request and provide the certificate at your earliest convenience.\n\nThank you for your assistance.\n\nRegards,\nJaiwant Karrun"

Return ONLY valid JSON matching this exact structure:

For Gmail:
{
  "intent": "send_email",
  "channel": "gmail",
  "recipient": {
    "name": string,
    "email": string
  },
  "subject": string (Generated professional email subject),
  "content": string (Generated full professional email body),
  "language": "english" | "tamil" | "tanglish",
  "schedule": {
    "isScheduled": boolean,
    "date": string or null,
    "time": string or null,
    "timezone": "Asia/Kolkata"
  }
}

For Telegram:
{
  "intent": "send_message",
  "channel": "telegram",
  "recipient": {
    "chatId": string
  },
  "content": string (Generated natural Telegram message),
  "language": "english" | "tamil" | "tanglish",
  "schedule": {
    "isScheduled": boolean,
    "date": string or null,
    "time": string or null,
    "timezone": "Asia/Kolkata"
  }
}
`;

    if (this.apiKey && !this.apiKey.includes('placeholder')) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `User Command: "${command}"` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 12000
          }
        );

        const resultText = response.data.choices[0].message.content;
        const parsed = JSON.parse(resultText);
        const tokenUsage = response.data.usage || null;
        const normalized = this.normalizeParsedCommand(parsed, command, attachments);
        normalized.tokenUsage = tokenUsage || this.estimateTokenUsage(command, normalized.content || '', normalized.subject || '');
        return normalized;
      } catch (err) {
        console.warn(`[Groq AI] API call error (${err.message}). Using smart fallback generator.`);
      }
    }

    const fallback = this.fallbackHeuristicParser(command, attachments);
    fallback.tokenUsage = this.estimateTokenUsage(command, fallback.content || '', fallback.subject || '');
    return fallback;
  }

  estimateTokenUsage(command, content = '', subject = '') {
    const text = `${command} ${subject} ${content}`;
    return Math.max(0, Math.ceil(text.length / 4));
  }

  /**
   * Convert spoken email patterns in text into valid email addresses
   * E.g., "john dot smith at gmail dot com" -> "john.smith@gmail.com"
   */
  normalizeSpokenEmailText(text) {
    if (!text) return '';
    let result = text;

    result = result.replace(/\b([a-zA-Z0-9._%+-]+(?:\s+(?:dot|period|_|underscore|-|hyphen|dash)\s+[a-zA-Z0-9._%+-]+)*)\s+(?:at|@)\s+([a-zA-Z0-9-]+(?:\s+(?:dot|period)\s+[a-zA-Z0-9-]+)*)\s+(?:dot|period|\.)\s+([a-zA-Z]{2,})\b/gi, (match, username, domain, tld) => {
      let cleanUser = username
        .replace(/\s+(?:dot|period)\s+/gi, '.')
        .replace(/\s+(?:underscore)\s+/gi, '_')
        .replace(/\s+(?:hyphen|dash)\s+/gi, '-')
        .replace(/\s+/g, '');
      let cleanDomain = domain
        .replace(/\s+(?:dot|period)\s+/gi, '.')
        .replace(/\s+/g, '');
      return `${cleanUser}@${cleanDomain}.${tld.toLowerCase()}`;
    });

    return result;
  }

  /**
   * Extract clean, validated array of email recipients from text command and parsed AI output
   */
  extractAllRecipients(command, parsedRecipients = []) {
    const normalizedText = this.normalizeSpokenEmailText(command);
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const matches = normalizedText.match(emailRegex) || [];

    const rawList = [...matches];

    if (Array.isArray(parsedRecipients)) {
      rawList.push(...parsedRecipients);
    } else if (typeof parsedRecipients === 'string' && parsedRecipients) {
      rawList.push(parsedRecipients);
    } else if (parsedRecipients && parsedRecipients.email) {
      rawList.push(parsedRecipients.email);
    }

    const cleanList = [];
    const seen = new Set();

    for (let raw of rawList) {
      if (!raw || typeof raw !== 'string') continue;
      
      let clean = raw.trim().toLowerCase();
      clean = clean.replace(/[.,;:!()\]\[>]+$/, '');
      clean = clean.replace(/^[<(\[]+/, '');

      const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
      if (isValid && !seen.has(clean)) {
        seen.add(clean);
        cleanList.push(clean);
      }
    }

    return cleanList;
  }

  /**
   * Calculate exact scheduled execution timestamp (relative or explicit)
   */
  calculateScheduledExecutionTime(command, aiSchedule = {}) {
    const lowerCmd = (command || '').toLowerCase();
    const now = new Date();

    // 1. Strict Relative Delay: "after 10 minutes", "in 30 mins", "after 2 hours", "after 1 day"
    // MUST match explicit time unit: minute, mins, hour, hrs, day, days
    const relativeMatch = lowerCmd.match(/\b(?:after|in)\s+(\d+)\s*(minutes?|mins?|hours?|hrs?|days?)\b/i);

    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2].toLowerCase();
      const scheduledDate = new Date(now.getTime());

      if (unit.startsWith('min')) {
        scheduledDate.setMinutes(scheduledDate.getMinutes() + amount);
      } else if (unit.startsWith('hour') || unit.startsWith('hr')) {
        scheduledDate.setHours(scheduledDate.getHours() + amount);
      } else if (unit.startsWith('day')) {
        scheduledDate.setDate(scheduledDate.getDate() + amount);
      }

      return {
        isScheduled: true,
        nextExecution: scheduledDate,
        date: scheduledDate.toLocaleDateString('en-IN'),
        time: scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // 2. Strict Explicit Clock Time: "at 5 PM", "at 5:30 PM", "5:30 PM", "9 AM", "at 17:30"
    const explicitClockMatch = lowerCmd.match(/\b(?:at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?|(\d{1,2})\s*(am|pm))\b/i);
    
    let targetHours = null;
    let targetMinutes = 0;
    let hasExplicitClockTime = false;

    if (explicitClockMatch) {
      const fullMatch = explicitClockMatch[0].toLowerCase();
      const matchDetails = fullMatch.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (matchDetails) {
        let h = parseInt(matchDetails[1], 10);
        let m = matchDetails[2] ? parseInt(matchDetails[2], 10) : 0;
        let ampm = matchDetails[3] ? matchDetails[3].toLowerCase() : null;

        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;

        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          targetHours = h;
          targetMinutes = m;
          hasExplicitClockTime = true;
        }
      }
    }

    // 3. Strict Date Keywords
    const isTomorrow = lowerCmd.includes('tomorrow') ||
                       lowerCmd.includes('naalaikku') ||
                       /\b(?:next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(lowerCmd) ||
                       /\b(?:on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(lowerCmd);

    const hasExplicitScheduleKeyword = lowerCmd.includes('schedule') || lowerCmd.includes('scheduled for');

    // ONLY mark as scheduled if user explicitly provided a relative delay, clock time, tomorrow/date keyword, or explicit schedule instruction!
    const isScheduled = !!(hasExplicitClockTime || isTomorrow || (aiSchedule.isScheduled && (hasExplicitScheduleKeyword || aiSchedule.time || aiSchedule.date)));

    if (isScheduled) {
      const scheduledDate = new Date(now.getTime());

      if (isTomorrow) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      if (hasExplicitClockTime) {
        scheduledDate.setHours(targetHours, targetMinutes, 0, 0);
        if (!isTomorrow && scheduledDate <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
      }

      return {
        isScheduled: true,
        nextExecution: scheduledDate,
        date: scheduledDate.toLocaleDateString('en-IN'),
        time: scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
    }

    return {
      isScheduled: false,
      nextExecution: null,
      date: null,
      time: null
    };
  }

  /**
   * Generate clean, professional HTML email body
   */
  generateHtmlEmailBody({ subject, content, attachments = [], recipientName = '' }) {
    const safeContent = content || '';
    const paragraphs = safeContent
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #334155; font-size: 15px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    let attachmentHtml = '';
    if (attachments && attachments.length > 0) {
      const imageItems = attachments.map((att, idx) => {
        const src = att.data || att.url || '';
        if (!src) return '';
        return `
          <div style="margin-top: 16px; text-align: center;">
            <img src="${src}" alt="${att.filename || 'Attached Image ' + (idx + 1)}" style="max-width: 100%; max-height: 500px; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: inline-block;" />
            <p style="font-size: 12px; color: #64748b; margin-top: 6px; font-weight: 600;">📎 ${att.filename || 'Attachment ' + (idx + 1)}</p>
          </div>
        `;
      }).filter(Boolean).join('');

      if (imageItems) {
        attachmentHtml = `
          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px dashed #cbd5e1;">
            <p style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 12px 0;">Attached Image(s):</p>
            ${imageItems}
          </div>
        `;
      }
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject || 'CommandFlow AI Notification'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
          <tr>
            <td style="background-color: #2563eb; padding: 24px 32px; text-align: left;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Segoe UI', Arial, sans-serif;">CommandFlow AI</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: left; color: #334155;">
              ${paragraphs}
              ${attachmentHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              Sent automatically via <strong style="color: #2563eb;">CommandFlow AI Automation Platform</strong>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Normalize and validate parsed JSON structure
   */
  normalizeParsedCommand(parsed, originalCommand, attachments = []) {
    const lowerCmd = originalCommand.toLowerCase();
    
    // Detect channel
    let channel = parsed.channel || 'gmail';
    if (lowerCmd.includes('telegram')) channel = 'telegram';
    else if (lowerCmd.includes('gmail') || lowerCmd.includes('email') || lowerCmd.includes('mail')) channel = 'gmail';

    // Detect language
    let language = parsed.language || 'english';
    if (/[\u0B80-\u0BFF]/.test(originalCommand)) language = 'tamil';
    else if (/(naalaikku|irukku|panni|pannu|sollu|sir-ku|advisor-ku|anuppu|varuven|varuvennu)/i.test(originalCommand)) language = 'tanglish';

    // Extract recipients
    const recipientsList = this.extractAllRecipients(originalCommand, parsed.recipient || parsed.recipients);
    // Telegram chat ID extraction regex
    const chatIdMatch = originalCommand.match(/\b\d{7,12}\b/);

    // Schedule calculation
    const scheduleInfo = this.calculateScheduledExecutionTime(originalCommand, parsed.schedule || {});

    // Ensure content is generated and NOT raw user command
    const generatedContent = this.ensureGeneratedContent(parsed.content, parsed.subject, originalCommand, channel, language);
    const generatedSubject = this.ensureGeneratedSubject(parsed.subject, originalCommand, channel);
    const htmlBody = channel === 'gmail' ? this.generateHtmlEmailBody({ subject: generatedSubject, content: generatedContent, attachments }) : '';

    if (channel === 'gmail') {
      const primaryEmail = recipientsList.length > 0 ? recipientsList[0] : '';
      const recipientName = parsed.recipient?.name || (primaryEmail ? primaryEmail.split('@')[0] : 'Recipient');
      
      return {
        intent: parsed.intent || 'send_email',
        channel: 'gmail',
        recipient: {
          name: recipientName,
          email: primaryEmail,
          recipients: recipientsList
        },
        recipients: recipientsList,
        subject: generatedSubject,
        content: generatedContent,
        htmlBody,
        language,
        schedule: {
          isScheduled: scheduleInfo.isScheduled,
          nextExecution: scheduleInfo.nextExecution,
          date: scheduleInfo.date,
          time: scheduleInfo.time,
          timezone: 'Asia/Kolkata'
        }
      };
    } else {
      const recipientChatId = chatIdMatch ? chatIdMatch[0] : (parsed.recipient?.chatId || (process.env.TELEGRAM_DEFAULT_CHAT_ID || '7793673257'));
      
      return {
        intent: parsed.intent || 'send_message',
        channel: 'telegram',
        recipient: {
          chatId: recipientChatId
        },
        recipients: [],
        content: generatedContent,
        language,
        schedule: {
          isScheduled: scheduleInfo.isScheduled,
          nextExecution: scheduleInfo.nextExecution,
          date: scheduleInfo.date,
          time: scheduleInfo.time,
          timezone: 'Asia/Kolkata'
        }
      };
    }
  }

  /**
   * Helper to ensure content is an actual generated message and NOT the raw command string
   */
  ensureGeneratedContent(content, subject, command, channel, language) {
    const trimmedCmd = command.trim();
    // If content is missing, or is identical to the raw command, or contains raw command wrapper, generate smart content
    if (!content || content.trim() === trimmedCmd || content.includes(`Command: "${trimmedCmd}"`)) {
      return this.generateSmartContentFromCommand(command, channel, language);
    }
    return content;
  }

  /**
   * Helper to ensure subject is a professional subject and NOT raw command
   */
  ensureGeneratedSubject(subject, command, channel) {
    if (channel !== 'gmail') return '';
    const trimmedCmd = command.trim();
    if (!subject || subject.trim() === trimmedCmd || subject.includes('CommandFlow Message')) {
      return this.generateSubjectFromCommand(command);
    }
    return subject;
  }

  /**
   * Smart subject generator based on command intent
   */
  generateSubjectFromCommand(command) {
    const lower = command.toLowerCase();
    if (lower.includes('leave')) return 'Leave Request';
    if (lower.includes('bonafide')) return 'Request for Bonafide Certificate';
    if (lower.includes('absent') || lower.includes('not feeling well')) return 'Absence Notification';
    if (lower.includes('permission')) return 'Request for Permission';
    if (lower.includes('meeting')) return 'Meeting Request';
    if (lower.includes('late')) return 'Late Arrival Notice';
    return 'Official Communication';
  }

  /**
   * Smart fallback content generator based on natural language command
   */
  generateSmartContentFromCommand(command, channel, language) {
    const lower = command.toLowerCase();

    // Check if exact message was provided using "saying ...", "say ...", "message: ..."
    const sayingMatch = command.match(/(?:saying|say|message:)\s+["']?([^"']+)["']?/i);
    if (sayingMatch && sayingMatch[1]) {
      const explicitMsg = sayingMatch[1].trim();
      // Remove trailing schedule/channel words if caught
      return explicitMsg.replace(/\s+(through|via|by|tomorrow|at)\s+.*/i, '');
    }

    const exactMatch = command.match(/(?:exactly this message:?)\s+["']?([^"']+)["']?/i);
    if (exactMatch && exactMatch[1]) {
      return exactMatch[1].trim();
    }

    if (channel === 'telegram') {
      if (lower.includes('late')) return 'I will be arriving a bit late today.';
      if (lower.includes('reach')) {
        const timeMatch = command.match(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i);
        return `I will reach ${timeMatch ? `by ${timeMatch[0]}` : 'soon'}.`;
      }
      return command;
    }

    // Gmail letter / formal request generation
    if (lower.includes('leave')) {
      let reason = 'personal commitments';
      if (lower.includes("uncle's function") || lower.includes('uncle function')) {
        reason = "my uncle's function";
      } else if (lower.includes('sick') || lower.includes('fever') || lower.includes('not feeling well')) {
        reason = 'health reasons as I am not feeling well';
      }

      return `Dear Sir/Madam,\n\nI am writing to formally request leave of absence due to ${reason}. Due to this commitment, I will be unable to attend class.\n\nI kindly request you to consider my absence and grant me leave for the concerned day.\n\nThank you for your understanding.\n\nRegards,\nJaiwant Karrun`;
    }

    if (lower.includes('bonafide')) {
      return `Dear Sir/Madam,\n\nI am writing to kindly request the issuance of a Bonafide Certificate for official documentation purposes. I would be grateful if you could process my request and provide the certificate at your earliest convenience.\n\nThank you for your assistance.\n\nRegards,\nJaiwant Karrun`;
    }

    if (lower.includes('absent') || lower.includes('not feeling well')) {
      return `Dear Sir/Madam,\n\nI would like to inform you that I will be absent tomorrow as I am not feeling well. Kindly consider my absence.\n\nThank you for your understanding.\n\nRegards,\nJaiwant Karrun`;
    }

    if (lower.includes('permission')) {
      return `Dear Sir/Madam,\n\nI am writing to request permission regarding the upcoming academic event. I request you to kindly grant approval for the same.\n\nThank you for your support.\n\nRegards,\nJaiwant Karrun`;
    }

    // Default professional formal email generator
    return `Dear Sir/Madam,\n\nI am writing regarding the matter requested. Please find this official communication for your reference.\n\nThank you for your time and assistance.\n\nRegards,\nJaiwant Karrun`;
  }

  /**
   * Fallback heuristic parser when Groq API key is not active
   */
  fallbackHeuristicParser(command, attachments = []) {
    return this.normalizeParsedCommand({}, command, attachments);
  }

  /**
   * Helper for dynamic content generation
   */
  async generateContent(prompt) {
    if (this.apiKey && !this.apiKey.includes('placeholder')) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        return response.data.choices[0].message.content;
      } catch (err) {
        console.warn(`[Groq AI] Generate content error: ${err.message}`);
      }
    }
    return `Generated Content based on: "${prompt}"`;
  }
}

module.exports = new GroqService();
