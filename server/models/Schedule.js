const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  automationId: {
    type: String,
    required: true,
    index: true
  },
  command: {
    type: String,
    required: true
  },
  scheduleDetails: {
    date: String,
    time: String,
    cron: String,
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  nextExecution: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: [
      'SCHEDULED', 'QUEUED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED',
      'Scheduled', 'Running', 'Completed', 'Cancelled', 'Failed'
    ],
    default: 'SCHEDULED',
    index: true
  }
}, {
  timestamps: true
});

scheduleSchema.index({ status: 1, nextExecution: 1 });
scheduleSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
