const Wallet = require("../models/Wallet"); // Assuming you have a Wallet model
const User = require("../models/User");
const Ledger = require("../models/Ledger")

const generateTxnId = () => {
    return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

exports.getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ balance: wallet.balance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllWallet = async (req, res) => {
  try{
    const wallet = await Wallet.find({})

    return res.status(200).json({
      success: true,
      wallet
    });
  } catch(error) {
    console.error("Error fetching wallets:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.createLedgerEntry = async (params) => {
    try {
      const {
        userId,
        walletId,
        amount,
        type,
        method,
        metadata = {},
        description = "",
        status = "Success"
      } = params;
  
      const ledgerEntry = new Ledger({
        user: userId,
        wallet: walletId,
        txn_id: generateTxnId(),
        type,
        amount,
        method,
        metadata,
        description,
        status
      });
  
      await ledgerEntry.save();
      return ledgerEntry;
  
    } catch (error) {
      console.error("Error creating ledger entry:", error);
      throw new Error("Failed to create ledger entry");
    }
};

exports.handleOrderSettlement = async (params) => {
  try {
    const {
      orderId,
      orderAmount,
      sellerId,
      adminId,
      commissionPercentage = 10,
      productId
    } = params;

    // Calculate amounts
    const commissionAmount = (orderAmount * commissionPercentage) / 100;
    const sellerAmount = orderAmount - commissionAmount;

    // Find or create seller wallet
    let sellerWallet = await Wallet.findOne({ user: sellerId });
    if (!sellerWallet) {
      sellerWallet = new Wallet({
        user: sellerId,
        balance: 0,
        currency: 'INR',
        isActive: true
      });
      await sellerWallet.save();
    }

    // Find or create admin wallet
    let adminWallet = await Wallet.findOne({ user: adminId });
    if (!adminWallet) {
      adminWallet = new Wallet({
        user: adminId,
        balance: 0,
        currency: 'INR',
        isActive: true
      });
      await adminWallet.save();
    }

    // Create ledger entry for seller earnings
    await this.createLedgerEntry({
      userId: sellerId,
      walletId: sellerWallet._id,
      amount: sellerAmount,
      type: 'Auction Earnings',
      method: 'Wallet',
      metadata: {
        orderId,
        productId
      },
      description: `Earnings from order #${orderId} (after commission)`
    });

    // Create ledger entry for admin commission
    await this.createLedgerEntry({
      userId: adminId,
      walletId: adminWallet._id,
      amount: commissionAmount,
      type: 'Fee',
      method: 'Wallet',
      metadata: {
        orderId,
        productId
      },
      description: `Commission from order #${orderId} (${commissionPercentage}%)`
    });

    // Update seller wallet balance
    sellerWallet.balance += sellerAmount;
    await sellerWallet.save();

    // Update admin wallet balance
    adminWallet.balance += commissionAmount;
    await adminWallet.save();
  
    return {
      success: true,
      settlements: {
        seller: {
          amount: sellerAmount,
          wallet: sellerWallet._id
        },
        admin: {
          amount: commissionAmount,
          wallet: adminWallet._id
        }
      }
    };

  } catch (error) {
    console.error("Settlement Error:", error);
    throw new Error(`Failed to process settlement: ${error.message}`);
  }
};

exports.handleOrderRefund = async (params) => {
  try {
    const {
      orderId,
      orderAmount,
      sellerId,
      buyerId,
      adminId,
      refundFeePercentage = 5, // Default 5% refund processing fee
      productId
    } = params;

    // Calculate amounts
    const sellerAmount = (orderAmount * 10) / 100;
    const refundFeeAmount = (sellerAmount * refundFeePercentage) / 100;
    const buyerRefundAmount = sellerAmount - refundFeeAmount;

    // Find all relevant wallets
    const [sellerWallet, buyerWallet, adminWallet] = await Promise.all([
      Wallet.findOne({ user: sellerId }),
      Wallet.findOne({ user: buyerId }),
      Wallet.findOne({ user: adminId })
    ]);

    if (!sellerWallet || !buyerWallet || !adminWallet) {
      throw new Error('One or more required wallets not found');
    }

    // Check if seller has sufficient balance
    if (sellerWallet.balance < sellerAmount) {
      throw new Error('Insufficient seller wallet balance for refund');
    }

    // 1. Deduct full amount from seller wallet
    await createLedgerEntry({
      userId: sellerId,
      walletId: sellerWallet._id,
      amount: sellerAmount,
      type: 'Withdrawal',
      method: 'Wallet',
      metadata: {
        orderId,
        productId
      },
      description: `Refund deduction for order #${orderId}`
    });
    sellerWallet.balance -= orderAmount;
    await sellerWallet.save({ session });

    // 2. Add admin fee
    await createLedgerEntry({
      userId: adminId,
      walletId: adminWallet._id,
      amount: refundFeeAmount,
      type: 'Fee',
      method: 'Wallet',
      metadata: {
        orderId,
        productId
      },
      description: `Refund processing fee for order #${orderId} (${refundFeePercentage}%)`
    });
    adminWallet.balance += refundFeeAmount;
    await adminWallet.save({ session });

    // 3. Add refund amount to buyer wallet
    await createLedgerEntry({
      userId: buyerId,
      walletId: buyerWallet._id,
      amount: buyerRefundAmount,
      type: 'Refund',
      method: 'Wallet',
      metadata: {
        orderId,
        productId
      },
      description: `Refund received for order #${orderId}`
    });
    buyerWallet.balance += buyerRefundAmount;
    await buyerWallet.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      refundDetails: {
        seller: {
          deductedAmount: orderAmount,
          wallet: sellerWallet._id
        },
        admin: {
          feeAmount: refundFeeAmount,
          wallet: adminWallet._id
        },
        buyer: {
          refundAmount: buyerRefundAmount,
          wallet: buyerWallet._id
        }
      }
    };

  } catch (error) {
    console.error("Refund Processing Error:", error);
    throw new Error(`Failed to process refund: ${error.message}`);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await Ledger.find({wallet: wallet._id}).sort({createdAt: -1})

    return res.status(200).json({
      success: true,
      transactions
    });
  } catch(error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.getAllTransactions = async (req, res) => {
  try {    
    const wallet = await Wallet.findOne();

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await Ledger.find().sort({createdAt: -1})
    .populate({
      path: "wallet",
      populate: {
        path: "user",
        select: "first_name last_name email", // Fetch only necessary fields
      },
    })
    .populate({
      path: 'metadata.orderId',
      select: 'orderNumber'
    })
    .populate({
      path: 'metadata.productId',
      select: 'make model year'
    })

    return res.status(200).json({
      success: true,
      transactions
    });
  } catch(error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.walletStatus = async (req, res) => {
  try {
    const { walletId } = req.params;
    const { isActive } = req.body; 

    // Find the wallet and update the isActive status
    const wallet = await Wallet.findById(walletId);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    wallet.isActive = isActive;
    await wallet.save(); 

    res.json(wallet); // Respond with the updated wallet data
  } catch (error) {
    res.status(500).json({ message: 'Failed to update wallet status' });
  }
}