const express = require('express');
const router = express.Router();
const {register, login, verifyOTP, resendOTP, googleAuth, logout, verifyForgotPasswordOTP, changePassword, refreshToken} = require('../controller/authController');
const { protect, updateUserStatus, authorize, optionalProtect } = require('../middleware/authMiddleware');
const { addListing, getAllListings, getListingById, updateListing, updateApprovalStatus, updateListingStatus, getListingsByUser } = require('../controller/listingController');
const { getAllCategories, createCategory, addSubcategory, updateCategoryStatus, updateSubcategoryStatus, updateSubcategory, updateCategory, deleteSubcategory, deleteCategory } = require('../controller/categoryController');
const { auth } = require('google-auth-library');
const { getAllUsers } = require('../controller/userController');
const { getProfile, updateProfile, updateProfilePicture, getKYC } = require('../controller/profileController');
const { getWishlist, addItemToWishlist, removeWishlistItem } = require('../controller/wishlistController');
const {validateSignup} = require("../middleware/validateMiddleware.js");
const { getCart, addItemToCart, removeCartItem, clearCart } = require('../controller/cartController.js');
const { getAddresses, editAddress, removeAddress, addAddress } = require('../controller/addressController.js');
const { placeBid, getBidsByListing, getBidsByUser } = require('../controller/bidController.js');
const { createOrder, getOrder, getOrderByUser, getAllOrders, updateOrderStatus, updatePaymentStatus, getSellerOrders, cancelOrder, returnOrder, checkProductStatus, updateOrder } = require('../controller/orderController.js');
const { getAllKYCDocuments, searchKYCDocument } = require('../controller/KYCcontroller.js');
const { getAllActivity } = require('../controller/activityController.js');
const { fetchNotification, markNotificationAsRead, markAllNotificationsAsRead } = require('../controller/notificationController.js');


// Auhtorization
router.post('/signup',validateSignup, register);
router.post('/verify', verifyOTP)
router.post('/resendOTP', resendOTP);
router.post('/forgot-password', verifyForgotPasswordOTP);
router.post('/change-password', changePassword);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', protect, refreshToken);
router.post('/logout', protect, logout);


// notification
router.get('/notifications/unread', protect, fetchNotification)
router.post('/notifications/:notificationId/mark-read', protect, markNotificationAsRead)
router.post('/notifications/mark-all-read', protect, markAllNotificationsAsRead)


// Profile
router.get('/users/profile', protect, getProfile);
router.put('/users/profile', protect, updateProfile);
router.put('/users/profile-picture', protect, updateProfilePicture);
router.get('/kyc/:userId', protect, getKYC)



// Address
router.get('/address/:userId', protect, getAddresses);
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, editAddress);
router.delete('/address/:addressId', protect, removeAddress)



// Admin
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:userId/status', protect, authorize('admin'), updateUserStatus )
router.get('/documents', protect, getAllKYCDocuments)
router.get('/documents/search', searchKYCDocument)
router.get('/activity-log', protect, getAllActivity)



// Listings
router.get('/listings', optionalProtect, getAllListings);
router.get('/mylistings', protect, getListingsByUser);
router.post('/addListing', protect, addListing);
router.get('/listings/:id',optionalProtect, getListingById)
router.put('/listings/:id', protect, updateListing);
router.put('/listings/:listingId/approval', protect, updateApprovalStatus);
router.patch('/listings/:listingId/status',  protect, updateListingStatus);



// Bids
router.post('/listings/:listingId/bid', protect, placeBid);
router.get('/listings/:listingId/bids', protect, getBidsByListing);
router.get('/mybids',protect, getBidsByUser);



// categories
router.get('/categories', getAllCategories)
router.post('/categories', protect, authorize('admin'), createCategory);
router.post('/categories/:categoryId/subcategories', protect, authorize('admin'), addSubcategory);
router.put('/categories/:categoryId',protect, authorize('admin'), updateCategoryStatus)
router.put('/categories/:categoryId/name',protect, authorize('admin'), updateCategory);
router.put('/categories/:categoryId/subcategories/:subcategoryId', protect, authorize('admin'), updateSubcategoryStatus);
router.put('/categories/:categoryId/subcategories/:subcategoryId/name', protect, authorize('admin'), updateSubcategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory)
router.delete('/categories/:categoryId/subcategories/:subcategoryId', protect, authorize('admin'), deleteSubcategory)



// Wishlist
router.get('/wishlist/:userId', protect, getWishlist);
router.post('/wishlist', protect, addItemToWishlist);
router.delete('/wishlist/:listingId', protect, removeWishlistItem);



// Cart
router.get('/cart/:userId', protect, getCart);
router.post('/cart', protect, addItemToCart);
router.delete('/cart/:listingId', protect, removeCartItem);
router.delete('/cart/clear', protect, clearCart);


// Order
router.get('/listing/:listingId/status-check', protect, checkProductStatus)
router.post('/order/create', protect, createOrder);
router.get('/order/:orderId', protect, getOrder);
router.get('/order', protect, getOrderByUser);
router.get('/orders', protect, getAllOrders);
router.get('/seller-orders', protect,getSellerOrders );
router.put('/orders/:orderId/update', protect, updateOrder)
router.put('/orders/:orderId/status', protect, updateOrderStatus);
router.put('/orders/:orderId/payment-status', protect, updatePaymentStatus)
router.put('/orders/:orderId/order-cancellation', protect, cancelOrder);
router.put('/orders/:orderId/order-return', protect, returnOrder);


module.exports = router;