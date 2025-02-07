const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['message', 'bid_won', 'bid_lost', 'order_received', 'bid_placed', 'listing_ended'],
      required: true 
    },
    read: { type: Boolean, default: false },
    data: {
      // For messages
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: String,
      
      // For bids and orders
      listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
      bidAmount: Number,
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      
      // Common fields
      title: String,
      description: String,
    },
    createdAt: { type: Date, default: Date.now, expires: '30d' }
  });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
  
  module.exports = mongoose.model('Notification', notificationSchema);