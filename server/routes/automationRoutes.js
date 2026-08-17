const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const {
  createAutomationFromCommand,
  getAutomations,
  getAutomationById,
  getLogs,
  deleteAutomation
} = require('../controllers/automationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, upload.any(), createAutomationFromCommand);
router.get('/', protect, getAutomations);
router.get('/logs', protect, getLogs);
router.get('/:id', protect, getAutomationById);
router.delete('/:id', protect, deleteAutomation);

module.exports = router;
