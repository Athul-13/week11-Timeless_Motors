const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  orderType: {
    type: String,
    enum: ['Auction', 'Fixed price'],
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  tax: {
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 18
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'cod', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    // Razorpay specific fields
    razorpay_order_id: {
      type: String,
      sparse: true
    },
    razorpay_payment_id: {
      type: String,
      sparse: true
    },
    razorpay_signature: {
      type: String,
      sparse: true
    },
    transactionId: {
      type: String,
      sparse: true
    },
    paidAt: Date,
    // Additional payment details
    paymentAttempts: [{
      attemptedAt: Date,
      status: String,
      error: String
    }]
  },
  shippingAddress: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    landmark: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    phone_number: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  auctionDetails: {
    bidPrice: Number,
    bidEndTime: Date,
    timeRemaining: Number
  },
  timestamps: {
    orderedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date
  },
  cancellation: {
    reason: String,
    description: String,
    requestedAt: Date,
    processedAt: Date
  }
}, {
  timestamps: true
});

// Generate unique order number
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomUUID = uuidv4().split('-')[0]; // Get part of UUID for uniqueness
    
    this.orderNumber = `ORD${year}${month}${randomUUID}`;
  }
  next();
});

// Calculate total amount
orderSchema.pre('save', function(next) {
  this.totalAmount = this.price.amount + this.tax.amount;
  next();
});

// Create indexes
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1 });
orderSchema.index({ 'orderStatus': 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: 1 });
orderSchema.index({ 'payment.razorpay_order_id': 1 });
orderSchema.index({ 'payment.razorpay_payment_id': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;