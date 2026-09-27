const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleAuth, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const profileUpload = require('../middleware/profileUpload');

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, profileUpload.single('avatar'), updateProfile);

module.exports = router;
