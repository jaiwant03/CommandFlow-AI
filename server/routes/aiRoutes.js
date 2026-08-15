const express = require('express');
const router = express.Router();
const { parseAICommand, generateText, translateText } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/parse', protect, parseAICommand);
router.post('/command', protect, parseAICommand);
router.post('/generate', protect, generateText);
router.post('/translate', protect, translateText);

module.exports = router;
