const axios = require('axios');

/**
 * Groq AI Service for Intent Extraction, Content Generation, Multilingual Understanding
 */
class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'qwen/qwen3.8-27b';
    this.fallbackModels = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'allam-2-7b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ];
  }

  /**
   * Parse user command into structured JSON according to CommandFlow specifications
   */
  async processCommand(commandInput, attachments = []) {
    let command = '';
    let channelHint = '';
    let recipientHint = '';

    if (typeof commandInput === 'object' && commandInput !== null) {
      command = commandInput.userCommand || commandInput.command || '';
      channelHint = commandInput.channel || '';
      recipientHint = commandInput.recipient || '';
    } else {
      command = String(commandInput || '');
    }

    if (!command || !command.trim()) {
      throw new Error('Command text cannot be empty.');
    }

    const normalizedCommandText = this.normalizeSpokenEmailText(command);

    const systemPrompt = `You are the content-generation engine for CommandFlow AI. The user's original natural-language command is the source of truth. Understand exactly what the user is asking for and generate the requested email content. Never replace the requested purpose with a generic email template. Preserve all relevant details from the command. Return structured JSON containing intent, channel, recipients, subject, and message.

DETAILED RULES:
1. SOURCE OF TRUTH: The user's original command defines the topic, reason, tone, timing, attachments, and recipient. You must analyze the exact command.
2. CHANNEL DETECTION:
   - "gmail" for email requests (Gmail, email, mail, request letter, leave request, application, etc.).
   - "telegram" for messaging requests (Telegram, message, chat, text).
3. RECIPIENTS EXTRACTION:
   - For Gmail: Extract all target email addresses as an array in "recipients".
   - For Telegram: Extract Telegram chat ID into "recipients" array (default to ["7793673257"] if unspecified).
4. SUBJECT GENERATION (For Emails):
   - Generate a clear, professional, and specific email subject matching the user's request purpose.
   - Examples:
     * "send a bona fide request letter to official.jaiwantkarrunworks@gmail.com through gmail" -> subject: "Request for Bona Fide Certificate"
     * "send an apology email to abc@gmail.com" -> subject: "Apology Regarding Recent Inconvenience"
     * "send a leave request to abc@gmail.com because I am sick" -> subject: "Leave Request Due to Illness"
     * "send my project submission email to abc@gmail.com saying I have attached my project" -> subject: "Project Submission"
     * "send a meeting request to abc@gmail.com for tomorrow" -> subject: "Meeting Request for Tomorrow"
5. MESSAGE GENERATION (Email / Telegram Body):
   - Generate full, well-structured, professional email content.
   - Include formal salutation (e.g. "Dear Sir/Madam,"), comprehensive body paragraphs directly addressing the user's command (preserving all specific details, reasons like sickness or uncle's function, attachment mentions, or timing), and a formal sign-off ("Regards,\nJaiwant Karrun").
   - NEVER use generic placeholders like "Official Communication" or "I am writing regarding the matter requested".
6. OUTPUT SCHEMA:
Return ONLY a valid JSON object with the following schema:
{
  "intent": "send_email",
  "channel": "gmail",
  "recipients": ["recipient@example.com"],
  "subject": "Specific Generated Subject",
  "message": "Dear Sir/Madam,\n\nGenerated message body...\n\nRegards,\nJaiwant Karrun"
}`;

    const extractedEmails = this.extractAllRecipients(command);
    const userPayload = {
      userCommand: normalizedCommandText,
      channel: channelHint || (command.toLowerCase().includes('telegram') ? 'telegram' : 'gmail'),
      recipient: recipientHint || (extractedEmails.length > 0 ? extractedEmails[0] : undefined)
    };

    if (this.apiKey && !this.apiKey.includes('placeholder')) {
      for (const modelName of this.fallbackModels) {
        try {
          const response = await axios.post(
            this.apiUrl,
            {
              model: modelName,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userPayload) }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.2,
              max_tokens: 4096
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 30000
            }
          );

          const resultText = response.data.choices[0].message.content;
          const parsed = this.safeParseGroqJson(resultText);

          if (parsed) {
            const bodyContent = parsed.message || parsed.content || parsed.body || parsed.letter || parsed.email_body || parsed.text || '';
            if (bodyContent) {
              parsed.message = bodyContent;
              const tokenUsage = response.data.usage || null;
              const normalized = this.normalizeParsedCommand(parsed, command, attachments);
              normalized.tokenUsage = tokenUsage || this.estimateTokenUsage(command, normalized.message || '', normalized.subject || '');
              return normalized;
            }
          }
        } catch (err) {
          console.warn(`[Groq AI] Model ${modelName} error (${err.response?.status || err.message}). Trying next model...`);
        }
      }
    }

    console.warn(`[Groq AI] API call failed or unavailable for command: "${command}". Engaging resilient fallback content engine...`);
    return this.generateFallbackStructuredCommand(command, channelHint, recipientHint, attachments);
  }

  /**
   * Safely parse JSON from Groq output with error repair
   */
  safeParseGroqJson(text) {
    if (!text || typeof text !== 'string') return null;

    try {
      return JSON.parse(text);
    } catch (e) {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const jsonSub = text.substring(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(jsonSub);
          } catch (e3) {
            console.error('[Groq AI] JSON parse repair failed:', e3.message);
          }
        }
      }
    }
    return null;
  }

  estimateTokenUsage(command, content = '', subject = '') {
    const text = `${command} ${subject} ${content}`;
    return Math.max(0, Math.ceil(text.length / 4));
  }

  /**
   * Convert spoken email patterns in text into valid email addresses
   */
  normalizeSpokenEmailText(text) {
    if (!text || typeof text !== 'string') return '';
    let result = text;

    result = result.replace(/\b(?:at|@)\s+([a-zA-Z0-9-]+(?:\s+(?:dot|period|\.)\s+[a-zA-Z0-9-]+)+)\b/gi, (match, domainGroup) => {
      const cleanDomain = domainGroup.replace(/\s+(?:dot|period)\s+/gi, '.').replace(/\s+/g, '');
      return `@${cleanDomain}`;
    });

    result = result.replace(/\b([a-zA-Z0-9._%+-]+(?:\s+(?:dot|period|underscore|dash|hyphen)\s+[a-zA-Z0-9._%+-]+)+)\s*(?:at|@)\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi, (match, userPart, domainPart) => {
      let cleanUser = userPart
        .replace(/\s+(?:dot|period)\s+/gi, '.')
        .replace(/\s+(?:underscore)\s+/gi, '_')
        .replace(/\s+(?:dash|hyphen)\s+/gi, '-')
        .replace(/\s+/g, '');
      return `${cleanUser}@${domainPart.replace(/\s+/g, '')}`;
    });

    const domainRegex = /\b([a-zA-Z0-9._%+-]+(?:\s+[a-zA-Z0-9._%+-]+)*)\s*@\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;

    result = result.replace(domainRegex, (match, userPart, domainPart) => {
      const tokens = userPart.trim().split(/\s+/);
      const stopWords = new Set([
        'to', 'for', 'send', 'sending', 'email', 'mail', 'sent', 'letter',
        'message', 'address', 'unto', 'towards', 'via', 'with', 'through'
      ]);
      
      let emailTokens = [];
      for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        const lower = token.toLowerCase();
        
        if (stopWords.has(lower) && emailTokens.length > 0) {
          break;
        }
        
        emailTokens.unshift(token);
      }
      
      const prefixCount = tokens.length - emailTokens.length;
      const prefix = prefixCount > 0 ? tokens.slice(0, prefixCount).join(' ') + ' ' : '';
      
      let cleanUser = emailTokens.join('')
        .replace(/(?:dot|period)/gi, '.')
        .replace(/(?:underscore)/gi, '_')
        .replace(/(?:dash|hyphen)/gi, '-');

      const cleanDomain = domainPart.trim().toLowerCase();
      return `${prefix}${cleanUser.toLowerCase()}@${cleanDomain}`;
    });

    result = result.replace(/\b([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})\b/gi, '$1@$2.$3');

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
      for (let p of parsedRecipients) {
        if (typeof p === 'string') {
          const normP = this.normalizeSpokenEmailText(p);
          const pMatches = normP.match(emailRegex) || [];
          if (pMatches.length > 0) rawList.push(...pMatches);
          else rawList.push(p);
        } else if (p && p.email) {
          const normE = this.normalizeSpokenEmailText(p.email);
          const eMatches = normE.match(emailRegex) || [];
          if (eMatches.length > 0) rawList.push(...eMatches);
          else rawList.push(p.email);
        }
      }
    } else if (typeof parsedRecipients === 'string' && parsedRecipients) {
      const normP = this.normalizeSpokenEmailText(parsedRecipients);
      const pMatches = normP.match(emailRegex) || [];
      if (pMatches.length > 0) rawList.push(...pMatches);
      else rawList.push(parsedRecipients);
    } else if (parsedRecipients && parsedRecipients.email) {
      const normE = this.normalizeSpokenEmailText(parsedRecipients.email);
      const eMatches = normE.match(emailRegex) || [];
      if (eMatches.length > 0) rawList.push(...eMatches);
      else rawList.push(parsedRecipients.email);
    }

    const cleanList = [];
    const seen = new Set();

    for (let raw of rawList) {
      if (!raw || typeof raw !== 'string') continue;
      
      let clean = raw.trim().toLowerCase();
      clean = clean.replace(/[.,;:!()\]\[>]+$/, '');
      clean = clean.replace(/^[<(\[]+/, '');
      clean = clean.replace(/\s+/g, '');

      const isValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
      if (isValid && !seen.has(clean)) {
        seen.add(clean);
        cleanList.push(clean);
      }
    }

    return cleanList;
  }

  /**
   * Calculate exact scheduled execution timestamp
   */
  calculateScheduledExecutionTime(command, aiSchedule = {}) {
    const lowerCmd = (command || '').toLowerCase();
    const now = new Date();

    const relativeMatch = lowerCmd.match(/\b(?:after|in)\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?)\b/i);

    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2].toLowerCase();
      const scheduledDate = new Date(now.getTime());

      if (unit.startsWith('sec')) {
        scheduledDate.setSeconds(scheduledDate.getSeconds() + amount);
      } else if (unit.startsWith('min')) {
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

    const isTomorrow = lowerCmd.includes('tomorrow') ||
                       lowerCmd.includes('naalaikku') ||
                       /\b(?:next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(lowerCmd) ||
                       /\b(?:on\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(lowerCmd);

    const hasExplicitScheduleKeyword = lowerCmd.includes('schedule') || lowerCmd.includes('scheduled for');
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

    if (aiSchedule && (aiSchedule.isScheduled || aiSchedule.nextExecution || aiSchedule.time)) {
      const parsedTime = aiSchedule.nextExecution ? new Date(aiSchedule.nextExecution) : null;
      if (parsedTime && !isNaN(parsedTime.getTime()) && parsedTime > now) {
        return {
          isScheduled: true,
          nextExecution: parsedTime,
          date: parsedTime.toLocaleDateString('en-IN'),
          time: parsedTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
      }
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
  generateHtmlEmailBody({ subject, content, attachments = [] }) {
    const { formatEmailContent } = require('../utils/emailFormatter');
    const formatted = formatEmailContent({ subject, content });
    return formatted.html;
  }

  /**
   * Normalize and validate parsed JSON structure from Groq AI
   */
  normalizeParsedCommand(parsed, originalCommand, attachments = []) {
    const lowerCmd = originalCommand.toLowerCase();
    
    let channel = parsed.channel || 'gmail';
    if (lowerCmd.includes('telegram')) channel = 'telegram';
    else if (lowerCmd.includes('gmail') || lowerCmd.includes('email') || lowerCmd.includes('mail')) channel = 'gmail';

    let language = parsed.language || 'english';
    if (/[\u0B80-\u0BFF]/.test(originalCommand)) language = 'tamil';
    else if (/(naalaikku|irukku|panni|pannu|sollu|sir-ku|advisor-ku|anuppu|varuven|varuvennu)/i.test(originalCommand)) language = 'tanglish';

    const recipientsList = this.extractAllRecipients(originalCommand, parsed.recipients || parsed.recipient);
    const chatIdMatch = originalCommand.match(/\b\d{7,12}\b/);
    const scheduleInfo = this.calculateScheduledExecutionTime(originalCommand, parsed.schedule || {});

    let generatedSubject = parsed.subject ? String(parsed.subject).trim() : '';
    let generatedMessage = (parsed.message || parsed.content || '').trim();

    // Ensure subject and message are never empty
    if (channel === 'gmail') {
      if (!generatedSubject) {
        generatedSubject = this.generateFallbackSubject(originalCommand);
      }
      if (!generatedMessage) {
        generatedMessage = this.generateFallbackMessage(originalCommand);
      }
    }

    let htmlBody = '';
    if (channel === 'gmail') {
      const { formatEmailContent } = require('../utils/emailFormatter');
      const formatted = formatEmailContent({
        subject: generatedSubject,
        content: generatedMessage
      });
      generatedMessage = formatted.plainText;
      htmlBody = formatted.html;
    }

    if (channel === 'gmail') {
      const effectiveRecipients = recipientsList;
      const primaryEmail = effectiveRecipients[0] || '';
      const recipientName = (parsed.recipient?.name && parsed.recipient?.name !== 'Recipient') 
        ? parsed.recipient.name 
        : (primaryEmail ? primaryEmail.split('@')[0] : 'Recipient');

      return {
        intent: parsed.intent || 'send_email',
        channel: 'gmail',
        userCommand: originalCommand,
        recipient: {
          name: recipientName,
          email: primaryEmail,
          recipients: effectiveRecipients
        },
        recipients: effectiveRecipients,
        subject: generatedSubject,
        message: generatedMessage,
        content: generatedMessage, // backwards compatibility
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
        userCommand: originalCommand,
        recipient: {
          chatId: recipientChatId
        },
        recipients: [recipientChatId],
        subject: '',
        message: generatedMessage,
        content: generatedMessage, // backwards compatibility
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

  generateFallbackSubject(command = '') {
    const lowerCmd = (command || '').toLowerCase();
    if (lowerCmd.includes('fever') || lowerCmd.includes('sick') || lowerCmd.includes('illness') || lowerCmd.includes('ill')) {
      return 'Leave Application Due to Fever';
    } else if (lowerCmd.includes('leave') || lowerCmd.includes('absent') || lowerCmd.includes('permission')) {
      return 'Formal Leave Application';
    } else if (lowerCmd.includes('apology')) {
      return 'Formal Letter of Apology';
    } else if (lowerCmd.includes('bona fide') || lowerCmd.includes('bonafide')) {
      return 'Request for Bona Fide Certificate';
    } else if (lowerCmd.includes('meeting')) {
      return 'Meeting Schedule Request';
    } else if (lowerCmd.includes('project')) {
      return 'Project Submission and Overview';
    }
    return 'Official Communication from Student';
  }

  generateFallbackMessage(command = '') {
    const lowerCmd = (command || '').toLowerCase();
    if (lowerCmd.includes('leave') || lowerCmd.includes('fever') || lowerCmd.includes('sick')) {
      return `Respected Class Mentor,

I hope this email finds you in good health. I am writing to formally request a leave of absence from classes as I am currently suffering from high fever and severe fatigue.

Upon medical consultation, the doctor diagnosed an acute fever and advised complete bed rest and medication for recovery to prevent further weakness. Due to my present health condition, I will not be able to attend the lectures, practical lab sessions, and scheduled academic activities.

I understand the importance of ongoing coursework and attendance. During my absence, I will stay updated with my peers regarding the topics covered and assignments given. I assure you that I will promptly complete all missed assignments and coursework as soon as I recover and resume classes.

I kindly request you to grant me leave for the duration of my illness. I will present the medical certificate and prescription from the consulting physician upon my return.

Thank you very much for your understanding, kindness, and support.

Yours faithfully,
Jaiwant Karrun
Student`;
    }

    if (lowerCmd.includes('apology')) {
      return `Respected Sir/Madam,

I am writing this email to sincerely apologize for my absence and any inconvenience caused. I deeply regret not being able to fulfill my responsibilities on time.

I take full responsibility for this lapse and have taken appropriate steps to ensure this does not recur in the future. I am actively working on catching up with all outstanding tasks.

I kindly request you to accept my apology and consider my situation with understanding.

Thank you for your patience and consideration.

Yours sincerely,
Jaiwant Karrun`;
    }

    return `Dear Sir/Madam,

I hope this message finds you well. I am writing to formally communicate regarding: "${command}".

Please find the necessary details and context provided above. Kindly review the information and let me know if any further clarification or documentation is required from my side.

Thank you very much for your time, assistance, and support.

Warm regards,
Jaiwant Karrun`;
  }

  generateFallbackStructuredCommand(command, channelHint, recipientHint, attachments = []) {
    const extractedEmails = this.extractAllRecipients(command, recipientHint);
    const channel = channelHint || (command.toLowerCase().includes('telegram') ? 'telegram' : 'gmail');
    const subject = this.generateFallbackSubject(command);
    const message = this.generateFallbackMessage(command);

    const parsed = {
      intent: channel === 'gmail' ? 'send_email' : 'send_message',
      channel,
      recipients: extractedEmails.length > 0 ? extractedEmails : (recipientHint ? [recipientHint] : ['jksam37@gmail.com']),
      subject,
      message
    };

    return this.normalizeParsedCommand(parsed, command, attachments);
  }

  async generateContent(prompt) {
    if (this.apiKey && !this.apiKey.includes('placeholder')) {
      for (const model of this.fallbackModels) {
        try {
          const response = await axios.post(
            this.apiUrl,
            {
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 2048
            },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000
            }
          );
          return response.data.choices[0].message.content;
        } catch (err) {
          console.warn(`[Groq AI] Generate content error (${model}): ${err.message}`);
        }
      }
    }
    return `Generated Content based on: "${prompt}"`;
  }
}

module.exports = new GroqService();

