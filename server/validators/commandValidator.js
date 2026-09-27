const { z } = require('zod');
const AppError = require('../utils/appError');

// Email regex conforming to standard syntax
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Telegram Chat ID regex (standard numeric chat ID or username with @)
const TELEGRAM_CHAT_ID_REGEX = /^-?\d{5,15}$|^@[a-zA-Z0-9_]{4,32}$/;

/**
 * Zod Schema for Incoming Command HTTP Request
 */
const createCommandSchema = z.object({
  command: z
    .string({ required_error: 'Command text is required.' })
    .trim()
    .min(2, { message: 'Command text must be at least 2 characters long.' })
    .max(2000, { message: 'Command text cannot exceed 2000 characters.' }),
  inputType: z.enum(['text', 'voice']).default('text'),
  idempotencyKey: z.string().trim().optional(),
  channel: z.enum(['gmail', 'telegram']).optional(),
  recipient: z.string().trim().optional(),
  scheduledAt: z.string().datetime().optional()
});

/**
 * Zod Schema for AI-Parsed Command Output Validation
 */
const validatedCommandPlanSchema = z.object({
  intent: z.string().min(1, 'Intent cannot be empty.'),
  channel: z.enum(['gmail', 'telegram']),
  recipient: z.object({
    name: z.string().default('Recipient'),
    email: z.string().optional(),
    chatId: z.string().optional(),
    recipients: z.array(z.string()).default([])
  }),
  recipients: z.array(z.string()),
  subject: z.string().default(''),
  message: z.string().min(1, 'Message body cannot be empty.'),
  schedule: z.object({
    isScheduled: z.boolean().default(false),
    nextExecution: z.date().nullable().optional(),
    date: z.string().nullable().optional(),
    time: z.string().nullable().optional(),
    timezone: z.string().default('Asia/Kolkata')
  }).default({})
});

/**
 * Strict validator for AI-extracted command plan
 */
const validateCommandPlan = (plan) => {
  // 1. Schema check
  const parseResult = validatedCommandPlanSchema.safeParse(plan);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new AppError(`Command validation failed: ${errorMessages}`, 400, 'VALIDATION_ERROR', parseResult.error.errors);
  }

  const validPlan = parseResult.data;

  // 2. Channel specific validation
  if (validPlan.channel === 'gmail') {
    const emailList = validPlan.recipients.filter(r => EMAIL_REGEX.test(r.trim()));
    if (emailList.length === 0 && validPlan.recipient.email && EMAIL_REGEX.test(validPlan.recipient.email)) {
      emailList.push(validPlan.recipient.email.trim());
    }

    if (emailList.length === 0) {
      throw new AppError(
        "I couldn't identify a valid recipient email address. Please specify a valid email address.",
        400,
        'INVALID_RECIPIENT'
      );
    }

    if (!validPlan.subject || !validPlan.subject.trim()) {
      throw new AppError('Email subject cannot be empty.', 400, 'INVALID_SUBJECT');
    }
  }

  if (validPlan.channel === 'telegram') {
    const chatId = validPlan.recipient?.chatId || (validPlan.recipients.length > 0 ? validPlan.recipients[0] : null);
    if (!chatId || !TELEGRAM_CHAT_ID_REGEX.test(String(chatId).trim())) {
      throw new AppError(
        "Please provide a valid Telegram Chat ID or target username (e.g. 7793673257 or @username).",
        400,
        'INVALID_TELEGRAM_RECIPIENT'
      );
    }
  }

  // 3. Schedule timestamp validation
  if (validPlan.schedule?.isScheduled && validPlan.schedule?.nextExecution) {
    const execTime = new Date(validPlan.schedule.nextExecution).getTime();
    if (isNaN(execTime) || execTime <= Date.now()) {
      throw new AppError(
        'Scheduled execution time must be in the future.',
        400,
        'INVALID_SCHEDULE_TIME'
      );
    }
  }

  return validPlan;
};

module.exports = {
  createCommandSchema,
  validatedCommandPlanSchema,
  validateCommandPlan,
  EMAIL_REGEX,
  TELEGRAM_CHAT_ID_REGEX
};
