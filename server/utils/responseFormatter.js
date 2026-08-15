const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = 'Error', statusCode = 400, details = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    details
  });
};

module.exports = {
  sendSuccess,
  sendError
};
