const express = require('express');
const router = express.Router();
const {
  createAutomationFromCommand,
  getAutomations,
  getAutomationById,
  getLogs,
  deleteAutomation
} = require('../controllers/automationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createAutomationFromCommand);
router.get('/', protect, getAutomations);
router.get('/logs', protect, getLogs);
router.get('/:id', protect, getAutomationById);
router.delete('/:id', protect, deleteAutomation);

module.exports = router;
