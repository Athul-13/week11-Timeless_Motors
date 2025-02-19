const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getWalletBalance, getTransactions, getAllTransactions, getAllWallet, walletStatus } = require('../controller/walletController');
const router = express.Router();

router.get('/balance', protect, getWalletBalance);
router.get('/transactions', protect, getTransactions);
router.get('/all-transactions', protect, getAllTransactions);
router.get('/all-wallet', protect, getAllWallet);
router.patch('/:walletId/status', protect, walletStatus )

module.exports = router;