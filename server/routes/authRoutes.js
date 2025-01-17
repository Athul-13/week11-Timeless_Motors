const express = require('express');
const router = express.Router();
const {register, login, verifyOTP, resendOTP} = require('../controller/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { addListing, getAllListings } = require('../controller/listingController');

router.post('/signup', register);

router.post('/verify', verifyOTP)

router.post('/resendOTP', resendOTP);

router.post('/addListing', protect, addListing);

router.post('/login', login);

router.get('/listings', protect, authorize('admin'), getAllListings);

module.exports = router;