const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'english'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);
