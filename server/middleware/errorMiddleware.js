const { sendError } = require('../utils/responseFormatter');
const AppError = require('../utils/appError');

/**
 * Global Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred.';
  let details = err.details || null;

  // Handle specific known error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(val => val.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 404;
    errorCode = 'RESOURCE_NOT_FOUND';
    message = `Resource not found with id: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired. Please log in again.';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorCode = 'FILE_TOO_LARGE';
      message = 'Attachment exceeds the maximum allowed upload size (25MB).';
    } else {
      errorCode = 'UPLOAD_ERROR';
      message = err.message;
    }
  }

  // Safe logging without leaking sensitive tokens or passwords
  console.error(`[Error] [${req.method}] ${req.originalUrl} - Code: ${errorCode} - Message: ${message}`);
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err.stack);
  }

  return sendError(res, message, statusCode, errorCode, details);
};

/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  return sendError(
    res,
    `Cannot ${req.method} ${req.originalUrl} - Route not found.`,
    404,
    'ROUTE_NOT_FOUND'
  );
};

module.exports = { errorHandler, notFound };
