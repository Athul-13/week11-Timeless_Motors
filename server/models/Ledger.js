const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  txn_id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Payment', 'Refund', 'Auction Earnings', 'Fee', 'Adjustment'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed'],
    default: 'Pending',
  },
  method: {
    type: String,
    enum: ['Razorpay', 'Bank Transfer', 'Wallet', 'COD'],
    required: true,
  },
  metadata: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction'
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  description: String
});

ledgerSchema.index({ user: 1, timestamp: -1 });
ledgerSchema.index({ wallet: 1, timestamp: -1 });
ledgerSchema.index({ txn_id: 1 });
ledgerSchema.index({ 'metadata.productId': 1 });
ledgerSchema.index({ 'metadata.orderId': 1 });
ledgerSchema.index({ 'metadata.auctionId': 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);