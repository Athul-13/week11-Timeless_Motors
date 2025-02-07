const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  documentType: {
    type: String,
    enum: ['Passport', 'Aadhaar', 'Driver License', 'Voter ID', 'PAN Card'],
    required: true
  },
  documentUrl: {
    type: String, 
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('KYC', kycSchema);

