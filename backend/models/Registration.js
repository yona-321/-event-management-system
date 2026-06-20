const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  subEvent: {
    type: String,
    default: ''
  },
  name: { type: String, default: '' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  }
}, { timestamps: true });

module.exports = mongoose.model('Registration', registrationSchema);