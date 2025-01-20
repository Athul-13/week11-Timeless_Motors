const express = require('express');
const router = express.Router();
const {register, login, verifyOTP, resendOTP, googleAuth, logout} = require('../controller/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { addListing, getAllListings, getListingById } = require('../controller/listingController');
const { getAllCategories, createCategory, addSubcategory, updateSubcategory, updateCategory } = require('../controller/categoryController');
const { auth } = require('google-auth-library');
const { getAllUsers, updateUserStatus } = require('../controller/userController');


// Auhtorization
router.post('/signup', register);
router.post('/verify', verifyOTP)
router.post('/resendOTP', resendOTP);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', protect, logout);


// Admin
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:userId/status', protect, authorize, updateUserStatus )


// Listings
router.get('/listings', getAllListings);
router.post('/addListing', protect, addListing);
router.get('/listings/:id', getListingById)


// categories
router.get('/categories', getAllCategories)
router.post('/categories', protect, authorize('admin'), createCategory);
router.post('/categories/:categoryId/subcategories', protect, authorize('admin'), addSubcategory);
router.put('/categories/:categoryId',protect, authorize('admin'), updateCategory)
router.put('/categories/:categoryId/subcategories/:subcategoryId', protect, authorize('admin', updateSubcategory))


module.exports = router;