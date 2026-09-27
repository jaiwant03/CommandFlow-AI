const groqService = require('../services/groqService');
const contactService = require('../services/contactService');

/**
 * Parse natural language command into structured AI response
 * POST /api/ai/parse
 */
const parseAICommand = async (req, res) => {
  try {
    const { command, attachments = [] } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Command text is required.' });
    }

    const parsed = await groqService.processCommand({ userCommand: command }, attachments);

    // Resolve recipient from user's Contact Book if available
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const resolvedContact = await contactService.resolveRecipient(userId, {
      nameHint: parsed.recipient?.name,
      commandText: command,
      channel: parsed.channel
    });

    if (resolvedContact) {
      console.log(`[AI Parse Controller] Contact resolved from database: "${resolvedContact.name}" -> ${resolvedContact.email || resolvedContact.telegramId}`);
      if (parsed.channel === 'gmail' && resolvedContact.email) {
        parsed.recipients = [resolvedContact.email];
        parsed.recipient = {
          ...parsed.recipient,
          name: resolvedContact.name,
          email: resolvedContact.email,
          recipients: [resolvedContact.email],
          contactId: resolvedContact.contactId || resolvedContact._id
        };
      } else if (parsed.channel === 'telegram' && (resolvedContact.telegramId || resolvedContact.chatId)) {
        const tid = resolvedContact.telegramId || resolvedContact.chatId;
        parsed.recipients = [tid];
        parsed.recipient = {
          ...parsed.recipient,
          name: resolvedContact.name,
          chatId: tid,
          telegramId: tid,
          contactId: resolvedContact.contactId || resolvedContact._id
        };
      }
    }

    // Check missing recipient details
    let clarificationNeeded = false;
    let clarificationQuestion = null;

    const recipients = parsed.recipients || (parsed.recipient?.email ? [parsed.recipient.email] : []);
    if (parsed.channel === 'gmail' && recipients.length === 0) {
      clarificationNeeded = true;
      clarificationQuestion = `Please provide at least one valid email address.`;
    } else if (parsed.channel === 'telegram' && !parsed.recipient?.chatId) {
      clarificationNeeded = true;
      clarificationQuestion = `Telegram Chat ID is missing. Please provide Telegram Chat ID.`;
    }

    res.json({
      success: true,
      data: {
        ...parsed,
        clarificationNeeded,
        clarificationQuestion
      }
    });
  } catch (err) {
    console.error('[AI Parse Controller Error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateText = async (req, res) => {
  try {
    const { prompt } = req.body;
    const content = await groqService.generateContent(prompt);
    res.json({ success: true, content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const translateText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const prompt = `Translate the following text to ${targetLanguage}:\n\n"${text}"`;
    const translated = await groqService.generateContent(prompt);
    res.json({ success: true, translated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  parseAICommand,
  generateText,
  translateText
};
