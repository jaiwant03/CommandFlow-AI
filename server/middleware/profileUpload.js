const multer = require('multer');

const extensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!extensionsByMimeType[file.mimetype]) {
      const error = new Error('Profile photos must be JPEG, PNG, or WebP images.');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PROFILE_IMAGE';
      return callback(error);
    }
    callback(null, true);
  }
});

module.exports = {
  single: (fieldName) => (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 400;
        error.errorCode = 'PROFILE_PHOTO_TOO_LARGE';
        error.message = 'Profile photos must be smaller than 8 MB.';
      }
      next(error);
    });
  }
};