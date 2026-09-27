const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/commandflow_ai',
  jwtSecret: process.env.JWT_SECRET || 'commandflow_ai_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',

  // Groq AI
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  // n8n Workflow Automation
  n8nBaseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || 'n8n_sec_commandflow_2026',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/integrations/gmail/callback',

  // Telegram Bot Token
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || '7793673257',

  // Direct SMTP Email Delivery (Gmail or custom SMTP)
  emailUser: process.env.EMAIL_USER || process.env.GMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpFrom: process.env.SMTP_FROM || process.env.EMAIL_USER || 'CommandFlow AI <admin.jaiwant@gmail.com>',
  defaultRecipientEmail: process.env.DEFAULT_RECIPIENT_EMAIL || 'official.jaiwantkarrunworks@gmail.com',

  // Redis Configuration (Phase 5/6)
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  }
};

module.exports = config;
