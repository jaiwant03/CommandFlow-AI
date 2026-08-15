const express = require('express');
const router = express.Router();
const { createSchedule, getSchedules, deleteSchedule } = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSchedule);
router.get('/', protect, getSchedules);
router.delete('/:id', protect, deleteSchedule);

module.exports = router;
