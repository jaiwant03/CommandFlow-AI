const groqService = require('../services/groqService');

/**
 * Parse natural language command into structured AI response
 * POST /api/ai/parse
 */
const parseAICommand = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command || !command.trim()) {
      return res.status(400).json({ success: false, message: 'Command text is required.' });
    }

    const parsed = await groqService.processCommand(command);

    // Check missing recipient details
    let clarificationNeeded = false;
    let clarificationQuestion = null;

    if (parsed.channel === 'gmail' && !parsed.recipient.email) {
      clarificationNeeded = true;
      clarificationQuestion = `Recipient email address is missing for Gmail execution. Please provide an email address.`;
    } else if (parsed.channel === 'telegram' && !parsed.recipient.chatId) {
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
