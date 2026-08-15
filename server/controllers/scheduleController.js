const Schedule = require('../models/Schedule');
const Automation = require('../models/Automation');

const createSchedule = async (req, res) => {
  try {
    const { command, date, time, cron } = req.body;
    const automationId = `SCH-${Date.now()}`;
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';

    const schedule = await Schedule.create({
      userId,
      automationId,
      command,
      scheduleDetails: { date, time, cron },
      nextExecution: new Date(Date.now() + 86400000),
      status: 'SCHEDULED'
    });

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully.',
      data: schedule
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const schedules = await Schedule.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : '65b820a1c1d4a90012345678';
    const schedule = await Schedule.findOne({ _id: req.params.id, userId });
    
    if (schedule) {
      await Automation.updateOne({ automationId: schedule.automationId }, { status: 'CANCELLED' });
      await Schedule.deleteOne({ _id: req.params.id, userId });
    }
    
    res.json({ success: true, message: 'Schedule cancelled.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  deleteSchedule
};
