const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  automationId: {
    type: String,
    required: true
  },
  command: {
    type: String,
    required: true
  },
  scheduleDetails: {
    date: String,
    time: String,
    cron: String
  },
  nextExecution: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'Scheduled', 'Running', 'Completed', 'Cancelled', 'Failed'],
    default: 'SCHEDULED'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', scheduleSchema);
