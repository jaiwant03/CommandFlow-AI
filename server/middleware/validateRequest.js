const AppError = require('../utils/appError');

/**
 * Express middleware to validate request body with Zod schema
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      const message = details.map(d => `${d.field}: ${d.message}`).join(', ');
      return next(new AppError(`Validation failed: ${message}`, 400, 'VALIDATION_ERROR', details));
    }
    req.validatedBody = result.data;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateBody };
