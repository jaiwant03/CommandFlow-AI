const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  automationId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['gmail', 'telegram', 'system'],
    default: 'system'
  },
  status: {
    type: String,
    enum: ['PENDING', 'SCHEDULED', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'WAITING', 'INFO', 'RUNNING', 'Pending', 'Scheduled', 'Processing', 'Success', 'Failed', 'Cancelled', 'Waiting', 'Info', 'Running'],
    default: 'INFO'
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
