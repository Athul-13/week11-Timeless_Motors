const Order = require('../models/Order');
const User = require('../models/User');
const Listing = require('../models/Listing');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');;

// Helper for cleanup after successful order
const cleanupAfterPurchase = async (userId, listingId, session) => {
  try {
    // Remove from cart
    await Cart.updateOne(
      { },
      { $pull: { items: { product: listingId } } },
    );

    // Update listing status
    await Listing.findByIdAndUpdate(
      listingId,
      { 
        status: 'sold',
        last_bid_user_id: userId 
      },
    );
  } catch (error) {
    throw new Error('Cleanup failed: ' + error.message);
  }
};

// Helper for validating order data
const validateOrderData = async (listing, orderType, auctionDetails) => {
  if (!listing || listing.is_deleted) {
    throw new Error('Listing not found or has been deleted');
  }

  if (listing.status !== 'active') {
    throw new Error('This listing is no longer available');
  }

  if (listing.type !== orderType) {
    throw new Error(`This listing is not available for ${orderType} purchase`);
  }

  if (orderType === 'Auction') {
    const now = new Date();
    if (now < new Date(listing.start_date)) {
      throw new Error('Auction has not started yet');
    }
  }
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      product: listingId,
      orderType,
      payment,
      shippingAddress,
      auctionDetails
    } = req.body;

    // Validate user and listing existence
    const [user, listing] = await Promise.all([
      User.findById(userId),
      Listing.findById(listingId)
    ]);

    if (!user || user.status !== 'verified') {
      throw new Error('User not found or not verified');
    }

    // Validate listing and order type
    await validateOrderData(listing, orderType, auctionDetails);

    // Calculate price and tax
    const priceAmount = orderType === 'Auction' ? auctionDetails.bidPrice : listing.starting_bid;
    const taxAmount = (priceAmount * 0.18); // 18% GST
    const totalAmount = priceAmount + taxAmount;

    // Create new order
    const newOrder = new Order({
      user: userId,
      product: listingId,
      orderType,
      orderStatus: 'Pending',
      price: {
        amount: priceAmount,
        currency: 'INR'
      },
      tax: {
        amount: taxAmount,
        percentage: 18
      },
      totalAmount: totalAmount,
      payment: {
        method: payment.method,
        status: 'Pending'
      },
      shippingAddress,
      timestamps: {
        orderedAt: new Date()
      }
    });

    // Add auction details if applicable
    if (orderType === 'Auction') {
      newOrder.auctionDetails = {
        bidPrice: auctionDetails.bidPrice,
        bidEndTime: listing.end_date,
        timeRemaining: new Date(listing.end_date) - new Date()
      };
    }

    await newOrder.save();

    await cleanupAfterPurchase(userId, listingId);

    // Populate order details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('user', 'first_name last_name email phone_no')
      .populate('product', 'make model year fuel_type images');

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder
    });

  } catch (error) {
    console.error('Order Creation Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Order creation failed'
    });
}
}

exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find order by ID and populate relevant details
    const order = await Order.findById(orderId)
      .populate('user', 'first_name last_name email phone_no')
      .populate('product', 'make model year fuel_type images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const details = `User placed an order for ${listing.make} ${listing.model} (${listing.year}) for ₹${totalAmount}`;
    await logActivity(userId, "Order Created", details, req);

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
    });
  }
};

exports.getOrderByUser = async (req, res) => {
  try {
    const userId = req.user._id;

    
    const orders = await Order.find({ user: userId })
      .populate('product', 'make model year')
      .sort({ createdAt: -1 }); 

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'first_name last_name email phone_no') 
      .populate('product', 'make model year fuel_type images');

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error. Could not fetch orders.',
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    // Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    ).populate('user', 'first_name last_name email phone_no')
     .populate('product', 'make model year fuel_type images');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate payment status
    const validStatuses = ['Pending', 'Completed', 'Failed', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status',
      });
    }

    // Update payment status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 'payment.status': status },
      { new: true }
    ).populate('user', 'first_name last_name email phone_no')
     .populate('product', 'make model year fuel_type images');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
    });
  }
};

