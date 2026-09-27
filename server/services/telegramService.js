const axios = require('axios');
const config = require('../config/env');

/**
 * Dedicated Telegram Messaging Service
 * Interacts directly with Telegram Bot API with HTML formatting, markdown fallback, and error handling.
 */
class TelegramService {
  constructor() {
    this.botToken = config.telegramBotToken;
    this.defaultChatId = config.telegramDefaultChatId;
    this.apiUrl = 'https://api.telegram.org';
  }

  /**
   * Send a text message to a specific Telegram Chat ID
   */
  async sendMessage({ chatId, text, parseMode = 'HTML' }) {
    const targetChatId = chatId || this.defaultChatId;

    if (!targetChatId) {
      throw new Error('Telegram Chat ID is required to deliver message.');
    }

    if (!this.botToken) {
      console.warn('[TelegramService] TELEGRAM_BOT_TOKEN not configured. Running in simulated delivery mode.');
      return {
        success: true,
        messageId: `sim-tg-${Date.now()}`,
        chatId: targetChatId,
        provider: 'simulated_telegram',
        deliveredAt: new Date().toISOString()
      };
    }

    const payload = {
      chat_id: targetChatId,
      text: text || 'Hello from CommandFlow AI',
      parse_mode: parseMode
    };

    try {
      const response = await axios.post(
        `${this.apiUrl}/bot${this.botToken}/sendMessage`,
        payload,
        { timeout: 10000 }
      );

      return {
        success: true,
        messageId: response.data?.result?.message_id || `tg-${Date.now()}`,
        chatId: targetChatId,
        provider: 'telegram_bot_api',
        responseData: response.data?.result
      };
    } catch (error) {
      // If HTML parse fails, retry once with plain text
      if (parseMode === 'HTML' && error.response?.data?.description?.includes('can\'t parse entities')) {
        console.warn('[TelegramService] HTML formatting error, retrying with plain text...');
        return this.sendMessage({ chatId: targetChatId, text, parseMode: undefined });
      }

      const errMsg = error.response?.data?.description || error.message;
      console.error(`[TelegramService Delivery Error]: ${errMsg}`);
      throw new Error(`Telegram delivery failed: ${errMsg}`);
    }
  }
}

module.exports = new TelegramService();
