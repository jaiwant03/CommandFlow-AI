const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  automationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  idempotencyKey: {
    type: String,
    sparse: true,
    index: true
  },
  executionId: {
    type: String,
    sparse: true,
    index: true
  },
  jobId: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalCommand: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'tamil', 'tanglish'],
    default: 'english'
  },
  inputType: {
    type: String,
    enum: ['voice', 'text'],
    default: 'text'
  },
  intent: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['gmail', 'telegram'],
    required: true
  },
  recipient: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    recipients: [{ type: String }],
    phone: { type: String, default: '' },
    telegramId: { type: String, default: '' },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null }
  },
  generatedContent: {
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    htmlBody: { type: String, default: '' }
  },
  attachments: [{
    filename: { type: String },
    contentType: { type: String },
    data: { type: String }
  }],
  documentType: {
    type: String,
    default: null
  },
  pdfPath: {
    type: String,
    default: null
  },
  schedule: {
    date: { type: String, default: null },
    time: { type: String, default: null },
    cron: { type: String, default: null },
    nextExecution: { type: Date, default: null }
  },
  followUp: {
    required: { type: Boolean, default: false },
    days: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' }
  },
  status: {
    type: String,
    enum: [
      'CREATED', 'QUEUED', 'PROCESSING', 'SENDING', 'SENT', 'SUCCESS', 'FAILED',
      'RETRYING', 'SCHEDULED', 'CANCELLED', 'WAITING', 'RUNNING',
      // Legacy case compatibility
      'Pending', 'Processing', 'Scheduled', 'Running', 'Success', 'Failed', 'Waiting', 'Cancelled'
    ],
    default: 'QUEUED',
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastError: {
    type: String,
    default: null
  },
  n8nExecutionId: {
    type: String,
    default: null
  },
  clarificationNeeded: {
    type: Boolean,
    default: false
  },
  clarificationQuestion: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  aiTokenUsage: {
    type: Number,
    default: 0
  },
  responseTimeMs: {
    type: Number,
    default: 0
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for optimal production querying
automationSchema.index({ userId: 1, createdAt: -1 });
automationSchema.index({ status: 1, 'schedule.nextExecution': 1 });

module.exports = mongoose.model('Automation', automationSchema);
