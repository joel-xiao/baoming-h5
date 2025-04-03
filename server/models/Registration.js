const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  openid: {
    type: String,
    required: true
  },
  isTeamLeader: {
    type: Boolean,
    default: false
  },
  teamId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 99
  },
  orderNo: {
    type: String,
    unique: true
  },
  transactionId: {
    type: String,
    default: null
  },
  prepayId: {
    type: String,
    default: null
  },
  paymentTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
RegistrationSchema.index({ orderNo: 1 });
RegistrationSchema.index({ openid: 1 });
RegistrationSchema.index({ paymentStatus: 1 });
RegistrationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Registration', RegistrationSchema); 