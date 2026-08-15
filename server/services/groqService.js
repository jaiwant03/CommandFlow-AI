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
  async processCommand(command) {
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
        const normalized = this.normalizeParsedCommand(parsed, command);
        normalized.tokenUsage = tokenUsage || this.estimateTokenUsage(command, normalized.content || '', normalized.subject || '');
        return normalized;
      } catch (err) {
        console.warn(`[Groq AI] API call error (${err.message}). Using smart fallback generator.`);
      }
    }

    const fallback = this.fallbackHeuristicParser(command);
    fallback.tokenUsage = this.estimateTokenUsage(command, fallback.content || '', fallback.subject || '');
    return fallback;
  }

  estimateTokenUsage(command, content = '', subject = '') {
    const text = `${command} ${subject} ${content}`;
    return Math.max(0, Math.ceil(text.length / 4));
  }

  /**
   * Normalize and validate parsed JSON structure
   */
  normalizeParsedCommand(parsed, originalCommand) {
    const lowerCmd = originalCommand.toLowerCase();
    
    // Detect channel
    let channel = parsed.channel || 'gmail';
    if (lowerCmd.includes('telegram')) channel = 'telegram';
    else if (lowerCmd.includes('gmail') || lowerCmd.includes('email') || lowerCmd.includes('mail')) channel = 'gmail';

    // Detect language
    let language = parsed.language || 'english';
    if (/[\u0B80-\u0BFF]/.test(originalCommand)) language = 'tamil';
    else if (/(naalaikku|irukku|panni|pannu|sollu|sir-ku|advisor-ku|anuppu|varuven|varuvennu)/i.test(originalCommand)) language = 'tanglish';

    // Email extraction regex
    const emailMatch = originalCommand.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    // Telegram chat ID extraction regex
    const chatIdMatch = originalCommand.match(/\b\d{7,12}\b/);

    const isScheduled = !!(
      parsed.schedule?.isScheduled ||
      lowerCmd.includes('tomorrow') ||
      lowerCmd.includes('naalaikku') ||
      lowerCmd.includes(' at ') ||
      lowerCmd.includes('pm') ||
      lowerCmd.includes('am')
    );

    let scheduleDate = parsed.schedule?.date || null;
    let scheduleTime = parsed.schedule?.time || null;

    if (isScheduled) {
      if (!scheduleDate && (lowerCmd.includes('tomorrow') || lowerCmd.includes('naalaikku'))) {
        scheduleDate = 'tomorrow';
      }
      if (!scheduleTime) {
        const timeMatch = lowerCmd.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|mani|manikku))/i);
        if (timeMatch) scheduleTime = timeMatch[0];
      }
    }

    // Ensure content is generated and NOT raw user command
    const generatedContent = this.ensureGeneratedContent(parsed.content, parsed.subject, originalCommand, channel, language);
    const generatedSubject = this.ensureGeneratedSubject(parsed.subject, originalCommand, channel);

    if (channel === 'gmail') {
      const recipientEmail = emailMatch ? emailMatch[0] : (parsed.recipient?.email || '');
      const recipientName = parsed.recipient?.name || (emailMatch ? emailMatch[0].split('@')[0] : 'Recipient');
      
      return {
        intent: parsed.intent || 'send_email',
        channel: 'gmail',
        recipient: {
          name: recipientName,
          email: recipientEmail
        },
        subject: generatedSubject,
        content: generatedContent,
        language,
        schedule: {
          isScheduled,
          date: scheduleDate,
          time: scheduleTime,
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
        content: generatedContent,
        language,
        schedule: {
          isScheduled,
          date: scheduleDate,
          time: scheduleTime,
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
  fallbackHeuristicParser(command) {
    return this.normalizeParsedCommand({}, command);
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
