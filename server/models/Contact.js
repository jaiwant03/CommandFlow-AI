const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Contact', contactSchema);
