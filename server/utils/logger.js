/**
 * Production Structured Logger for CommandFlow AI
 * Prevents secret leakage and tracks correlation IDs across the pipeline.
 */

const SENSITIVE_KEYS = new Set([
  'password', 'pass', 'token', 'jwt', 'secret', 'authorization',
  'cookie', 'apikey', 'api_key', 'privatekey', 'private_key'
]);

const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
};

const log = (level, message, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context.requestId ? { requestId: context.requestId } : {}),
    ...(context.commandId ? { commandId: context.commandId } : {}),
    ...(context.executionId ? { executionId: context.executionId } : {}),
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.jobId ? { jobId: context.jobId } : {}),
    ...(context.meta ? { meta: sanitizeData(context.meta) } : {})
  };

  const output = `[${logEntry.timestamp}] [${level.toUpperCase()}] ${logEntry.message}` +
    (context.commandId ? ` [cmd:${context.commandId}]` : '') +
    (context.executionId ? ` [exec:${context.executionId}]` : '');

  if (level === 'error') {
    console.error(output, context.meta ? JSON.stringify(sanitizeData(context.meta)) : '');
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }

  return logEntry;
};

module.exports = {
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
  debug: (msg, ctx) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, ctx);
  },
  sanitizeData
};
