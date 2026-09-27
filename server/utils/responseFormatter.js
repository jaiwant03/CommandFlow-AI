/**
 * Standardized API Response Formatter for CommandFlow AI
 */

const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    data
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'An unexpected error occurred', statusCode = 400, errorCode = 'BAD_REQUEST', details = null) => {
  return res.status(statusCode).json({
    success: false,
    message, // Preserves compatibility with existing frontend error handling
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {})
    }
  });
};

module.exports = {
  sendSuccess,
  sendError
};
