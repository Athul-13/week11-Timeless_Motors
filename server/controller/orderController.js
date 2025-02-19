const Order = require('../models/Order');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet')
const logActivity = require('../utils/logActivity');
const { createLedgerEntry, handleOrderSettlement } = require('./walletController');

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
      auctionDetails,
      razorpay_order_id,
      razorpay_payment_id
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
    const taxAmount = priceAmount * 0.18; // 18% GST
    const totalAmount = priceAmount + taxAmount;

    // Fetch or Create User Wallet
    let userWallet = await Wallet.findOne({ user: userId });

    if (!userWallet) {
      userWallet = new Wallet({
        user: userId,
        balance: 0,
        currency: 'INR',
        isActive: true
      });
      await userWallet.save();
    }

    // Handle Wallet Payments
    if (payment.method === 'wallet') {
      if (userWallet.balance < totalAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }
    
      // Create ledger entry for wallet withdrawal
      await createLedgerEntry({
        userId: userId,
        walletId: userWallet._id,
        amount: totalAmount,
        type: 'Withdrawal',
        method: 'Wallet',
        metadata: {
          orderId: newOrder._id,
          productId: listingId
        },
        description: `Wallet debit for order #${newOrder.orderNumber}`
      });
    
      // Deduct amount from wallet
      userWallet.balance -= totalAmount;
      await userWallet.save();
    }

    // Create new order
    const newOrder = new Order({
      user: userId,
      product: listingId,
      orderType,
      orderStatus: payment.method === 'cod' ? 'Pending' : 'Confirmed',
      price: {
        amount: priceAmount,
        currency: 'INR'
      },
      tax: {
        amount: taxAmount,
        percentage: 18
      },
      totalAmount,
      payment: {
        method: payment.method,
        status: payment.method === 'cod' ? 'Pending' : 'Completed',
        razorpay_order_id,
        razorpay_payment_id
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

    // Update listing status and handle cart cleanup
    await cleanupAfterPurchase(userId, listingId);

    // Populate order details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('user', 'first_name last_name email phone_no')
      .populate('product', 'make model year fuel_type images');

    await logActivity(userId, "Order Created", populatedOrder, req);

    // Create Ledger Entry for Payment Transactions
    if (payment.method === 'razorpay' || payment.method === 'wallet') {
      await createLedgerEntry({
        userId: userId,
        walletId: userWallet._id,
        amount: totalAmount,
        type: 'Payment',
        method: payment.method === 'wallet' ? 'Wallet' : 'Razorpay',
        metadata: {
          orderId: newOrder._id,
          productId: listingId
        },
        description: `Payment for order #${newOrder.orderNumber}`
      });
    }

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
};


exports.getOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    console.log('orderid:',orderId);
    
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

    console.log('order',order);

    const details = `User placed an order for ${order.make} ${order.model} (${order.year}) for ₹${order.totalAmount}`;

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

exports.getSellerOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    // First find all listings by this seller
    const sellerListings = await Listing.find({ seller_id: userId });
    const listingIds = sellerListings.map(listing => listing._id);

    // Then find all orders for these listings
    const sellerOrders = await Order.find({
      product: { $in: listingIds }
    }).populate('product').exec();

    res.status(200).json({
      success: true,
      sellerOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
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
     .populate('product', 'make model year fuel_type images seller_id');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (status === 'Delivered' ) {
      try {
        await handleOrderSettlement({
          orderId: updatedOrder._id,
          orderAmount: updatedOrder.totalAmount,
          sellerId: updatedOrder.product.seller_id,
          adminId: process.env.ADMIN_USER_ID,
          commissionPercentage: 10,
          productId: updatedOrder.product._id
        });
      } catch (settlementError) {
        console.error('Settlement Error:', settlementError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process settlement for delivered order',
        });
      }
    } else if (status === 'Refunded' && order.orderStatus !== 'Refunded') {
      try {
        await handleOrderRefund({
          orderId: updatedOrder._id,
          orderAmount: updatedOrder.totalAmount,
          sellerId: updatedOrder.product.seller,
          buyerId: updatedOrder.user._id,
          adminId: process.env.ADMIN_USER_ID,
          refundFeePercentage: 5,
          productId: updatedOrder.product._id
        });
      } catch (refundError) {
        console.error('Refund Error:', refundError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process refund',
        });
      }
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
    const validStatuses = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'];
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

