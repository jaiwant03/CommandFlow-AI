const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    enum: ['gmail', 'telegram', 'groq', 'n8n'],
    required: true
  },
  connected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Connected', 'Not Connected', 'Configuration Required'],
    default: 'Not Connected'
  },
  credentials: {
    type: Object,
    default: {}
  },
  lastSync: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Integration', integrationSchema);
