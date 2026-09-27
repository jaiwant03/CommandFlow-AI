const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  telegramId: {
    type: String,
    trim: true,
    default: ''
  },
  relationship: {
    type: String,
    default: 'General'
  },
  category: {
    type: String,
    default: 'Personal'
  },
  preferredChannel: {
    type: String,
    enum: ['gmail', 'telegram'],
    default: 'gmail'
  }
}, {
  timestamps: true
});

// Compound indexes for user contact book lookups
contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, email: 1 });
contactSchema.index({ userId: 1, relationship: 1 });

module.exports = mongoose.model('Contact', contactSchema);
