const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../public/uploads/profiles');
const extensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    fs.mkdirSync(uploadDirectory, { recursive: true });
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const extension = extensionsByMimeType[file.mimetype];
    callback(null, `${req.user._id}-${crypto.randomUUID()}${extension}`);
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!extensionsByMimeType[file.mimetype]) {
      return callback(new Error('Profile photos must be JPEG, PNG, or WebP images.'));
    }
    callback(null, true);
  }
});