const express = require('express');
const router = express.Router();
const { getIntegrations, connectIntegration, deleteIntegration } = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getIntegrations);
router.post('/connect', protect, connectIntegration);
router.delete('/:id', protect, deleteIntegration);

module.exports = router;
