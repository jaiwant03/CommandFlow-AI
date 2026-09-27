const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
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
  executionId: {
    type: String,
    default: null,
    index: true
  },
  jobId: {
    type: String,
    default: null
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
    enum: [
      'PENDING', 'QUEUED', 'SCHEDULED', 'PROCESSING', 'SENDING', 'SENT', 'SUCCESS', 'FAILED',
      'CANCELLED', 'WAITING', 'INFO', 'RUNNING',
      'Pending', 'Scheduled', 'Processing', 'Success', 'Failed', 'Cancelled', 'Waiting', 'Info', 'Running'
    ],
    default: 'INFO'
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

activityLogSchema.index({ automationId: 1, timestamp: 1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
