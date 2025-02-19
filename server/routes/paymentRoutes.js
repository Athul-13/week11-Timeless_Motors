const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');  // Import your Order model
const razorpay = require('../config/razorpayConfig');

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const options = {
      amount: Math.round(req.body.amount * 100), // amount in paise, rounded to avoid decimal issues
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order' 
    });
  }
});

// Verify payment
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment failed' });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      return res.status(200).json({ 
        success: true,
        message: "Payment verified successfully" 
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: "Invalid signature" 
      });
    }
  } catch (error) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ 
      success: false,
      message: "Payment verification failed" 
    });
  }
});

module.exports = router;