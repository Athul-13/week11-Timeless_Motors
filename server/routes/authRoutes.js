const express = require('express');
const router = express.Router();
const {register, login, verifyOTP, resendOTP, googleAuth, logout} = require('../controller/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { addListing, getAllListings, getListingById, updateListing, updateApprovalStatus, updateListingStatus } = require('../controller/listingController');
const { getAllCategories, createCategory, addSubcategory, updateSubcategory, updateCategory } = require('../controller/categoryController');
const { auth } = require('google-auth-library');
const { getAllUsers, updateUserStatus } = require('../controller/userController');
const { getProfile, updateProfile, updateProfilePicture, getAddress, updateAddress } = require('../controller/profileController');


// Auhtorization
router.post('/signup', register);
router.post('/verify', verifyOTP)
router.post('/resendOTP', resendOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', protect, logout);

// Profile
router.get('/users/profile', protect, getProfile);
router.put('/users/profile', protect, updateProfile);
router.put('/users/profile-picture', protect, updateProfilePicture);

// Address
router.get('/users/address', protect, getAddress);
router.put('/users/address', protect, updateAddress);


// Admin
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:userId/status', protect, authorize('admin'), updateUserStatus )


// Listings
router.get('/listings', getAllListings);
router.post('/addListing', protect, addListing);
router.get('/listings/:id', getListingById)
router.put('/listings/:id', protect, updateListing);
router.put('/listings/:listingId/approval', protect, updateApprovalStatus);
router.patch('/listings/:listingId/status',  protect, updateListingStatus);


// categories
router.get('/categories', getAllCategories)
router.post('/categories', protect, authorize('admin'), createCategory);
router.post('/categories/:categoryId/subcategories', protect, authorize('admin'), addSubcategory);
router.put('/categories/:categoryId',protect, authorize('admin'), updateCategory)
router.put('/categories/:categoryId/subcategories/:subcategoryId', protect, authorize('admin'), updateSubcategory);


module.exports = router;