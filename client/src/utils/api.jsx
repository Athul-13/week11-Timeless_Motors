import axios from 'axios';
import Cookies from 'js-cookie';

// const API_URL ="https://timeless-motors.onrender.com/api";
// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://3.108.55.55/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': "application/json"
    },
    withCredentials: true
});

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        console.log('Token in request:', token);

        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry && Cookies.get('refreshToken')) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token
                const response = await api.post('/api/refresh', {
                    refreshToken: Cookies.get('refreshToken')
                });

                const { token } = response.data;
                Cookies.set('token', token);

                // Retry original request
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear all auth data and redirect to login
                Cookies.remove('token');
                Cookies.remove('refreshToken');
                Cookies.remove('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle blocked user or other auth errors
        if (error.response?.data?.action === 'LOGOUT') {
            Cookies.remove('token');
            Cookies.remove('refreshToken');
            Cookies.remove('user');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);



export const authService = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        // Set cookie with optional configuration
        // Cookies.set('token', response.data.accessToken, {
        //     expires: 7, // expires in 7 days
        //     secure: import.meta.env.MODE === 'production',
        //     sameSite: 'strict', // protect against CSRF
        //     path: '/' // accessible across all pages
        // });
        // console.log('Token set:', Cookies.get('token'));
        const { accessToken } = response.data;

        console.log('Access Token:', accessToken);

        return response.data;
    },
    sendOTP: async (formData) => {
        try {
            const response = await api.post('/auth/signup', formData);
            return response.data;
        } catch (error) {
            console.error('OTP error:', error); // Add this for debugging
            throw error;
        }
    },
    verifyOTP: async (userData) => {
        const response = await api.post('/auth/verify', userData); // Adjust route if needed
        return response.data;
    },
    verifyForgotPasswordOTP: async (userData) => {
        const response = await api.post('/auth/forgot-Password', userData);
        return response.data;
    },
    resendOTP: async (email) => {
        const response = await api.post('/auth/resendOTP', {email});
        return response.data;
    },
    changePassword: async (userData) => {
        const response = await api.post('/auth/change-password', {userData});
        return response.data;
    },
    UpdatePicture: async ({imageUrl}) => {
        try {
            const token = Cookies.get('token');
            const response = await api.put('/auth/users/profile', {
                imageUrl: imageUrl,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            return response.data;
        } catch (err) {
            console.error('Uploading error:', err);
            throw err;
        }
    },
    logout: async () => {
        try {
            // 1. First revoke Google token if it exists
            if (window.google?.accounts?.id) {
                try {
                    const email = JSON.parse(Cookies.get('user'))?.email;
                    if (email) {
                        await window.google.accounts.id.revoke(email, () => {
                            console.log('Google Auth token revoked');
                        });
                    }
                    window.google.accounts.id.disableAutoSelect();
                } catch (error) {
                    console.error('Error revoking Google token:', error);
                }
            }

            // 2. Clear all cookies systematically
            const domain = window.location.hostname;
            const paths = ['/', '/api', '/auth', ''];
            
            // Get all cookies
            const cookies = Cookies.get();
            
            // Clear each cookie across all paths
            paths.forEach(path => {
                // Clear specific auth cookies
                Cookies.remove('token', { path, domain });
                Cookies.remove('user', { path, domain });
                Cookies.remove('g_state', { path, domain });
                
                // Clear any cookies starting with g_ (Google related)
                Object.keys(cookies).forEach(cookieName => {
                    if (cookieName.startsWith('g_') || 
                        cookieName.includes('google') || 
                        cookieName.includes('auth') ||
                        cookieName.includes('token')) {
                        Cookies.remove(cookieName, { path, domain });
                        // Also try removing from root domain
                        Cookies.remove(cookieName, { path, domain: `.${domain}` });
                    }
                });
            });

            // 3. Clear cookies from root domain as well
            Cookies.remove('token', { domain: `.${domain}` });
            Cookies.remove('user', { domain: `.${domain}` });
            
            // 4. Clear any local/session storage
            localStorage.clear();
            sessionStorage.clear();

            // 5. Only make the logout API call if we have a token
            const token = Cookies.get('token');
            if (token) {
                await api.post('/auth/logout', null, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            // Even if the API call fails, we still want to clear local data
            localStorage.clear();
            sessionStorage.clear();
            throw error;
        }
    },
    googleAuth: async (credential) => {
        try {
          const response = await api.post('/auth/google', {credential: credential} );

          if (response.data.accessToken) {
            Cookies.set('token', response.data.accessToken, {
                expires: 7,
                secure: import.meta.env.MODE === 'production',
                sameSite: 'strict',
                path: '/'
            });
        }
        return {
            success: true,
            token: response.data.accessToken,
            user: response.data.user  // Make sure your backend sends user data
        };
        } catch (error) {
            console.error("Google authentication failed:", error);
            throw error;
        }
    },
    refreshToken: async () => {
        const response = api.post('/auth/refresh', {});
        return response.data;
    }
};


export const listingService = {
    addListing: async (listingData) => {
        try {
            console.log('listing',listingData);
            const response = await api.post('/auth/addListing', listingData);
            return response.data;
        } catch (error) {
            console.error('Error adding listing:', error);
            throw error;
        }
    },
    getAllListings: async () => {
        try {
            const response = await api.get('/auth/listings');
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }        
    },
    getListingById: async (id) => {
        try {
            const response = await api.get(`/auth/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error getting listing:', error);
            throw error;
        }
    },
    getListingsByUser: async () => {
        try {
            const response = await api.get('/auth/mylistings');
            console.log('rep',response.data);
            return response.data
        } catch (error) {
            console.error('error fetching the list', error);
            throw error;
        }
    },
    updateListing: async (id, listingData) => {
        try {
            const response = await api.put(`/auth/listings/${id}`, listingData);
            return response.data;
        } catch (error) {
            console.error('Error updating listing:', error);
            throw error;
        }
    },
    updateApprovalStatus: async (id, status) => {
        try {
            const response = await api.put(`/auth/listings/${id}/approval`, {status});
            return response.data;
        } catch (err) {
            console.error('Error updating status:', err);
            throw err;
        }
    },
    updateListingStatus: async (id, status) => {
        try {
            const response = await api.patch(`/auth/listings/${id}/status`, {status});
            return response.data;
        } catch (err) {
            console.error('Error updating listing status:', err);
            throw err;
        }
    },
    deleteListing: async (id) => {
        try {
            const response = await api.delete(`/auth/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting listing:', error);
            throw error;
        }
    },
    placeBid: async (id, amount) => {
        try {
            const response = await api.post(`/auth/listings/${id}/bid`,{amount});
            return response.data;
        } catch (error) {
            console.error('Error placing bid', error)
        }
    },
    getBidsByListing: async (listingId) => {
        try {
            const response = await api.get(`/auth/listings/${listingId}/bids`);
            return response.data
        } catch (error) {
            console.error('Error fetching bids', error);
        }
    },
    getBidsByUser: async (page=1, limit=1) => {
        try {
            const response = await api.get(`/auth/mybids?page=${page}&limit=${limit}`);
            return response.data;
        } catch (error) {
            console.error('Error while fetching list', error);
        }
    }
};


export const orderService = {
    createOrder: async (orderData) => {
        console.log('api:',orderData);
      const response = await api.post('/auth/order/create', orderData);
      return response.data;
    },
    getOrder: async (orderId) => {
      const response = await api.get(`/auth/order/${orderId}`);
      return response.data;
    },
    getUserOrders: async (page=1, limit=1) => {
      const response = await api.get(`/auth/order?page=${page}&limit=${limit}`);
      return response.data;
    },
    getSellerOrders: async (page=1, limit=1) => {
        const response = await api.get(`/auth/seller-orders?page=${page}&limit=${limit}`);
        return response.data;
    },
    getAllOrders: async () => {
        const response = await api.get('/auth/orders');
        console.log('api',response.data);
        return response.data;
    },
    updateOrder: async (orderId, updatedData) => {
        console.log('inapi',updatedData);
        const response = await api.put(`/auth/orders/${orderId}/update`, updatedData)
        return response.data
    },
    updateOrderStatus: async (orderId, newStatus) => {
        const response = await api.put(`/auth/orders/${orderId}/status`, { status: newStatus });
        return response.data;
    },
    updatePaymentStatus: async (orderId, newStatus) => {
        const response = await api.put(`/auth/orders/${orderId}/payment-status`, { status: newStatus });
        return response.data;
    },
    checkProductAvailability: async(listingId) => {
        const response = await api.get(`/auth/listing/${listingId}/status-check`);
        return response.data;
    },
    createRazorpayOrder: async (data) => {
        const response = await api.post('/payment/create-order',data);
        console.log('res',response.data);
        return response.data;
    },
    verifyPayment: async (data) => {
        const response = await api.post('/payment/verify-payment', data);
        console.log('resp',response.data);
        return response.data;
    },
    orderCancellation: async (orderId, data) => {
        const response = await api.put(`/auth/orders/${orderId}/order-cancellation`, data);
        return response.data;
    },
    orderReturn: async (orderId, data) => {
        const response = await api.put(`/auth/orders/${orderId}/order-return`, data);
        return response.data;
    }
};


export const categoryService = {
    getAllCategories: async () => {
        const response = await api.get('/auth/categories');
        return response.data;
    },
    
    createCategory: async (categoryData) => {
        const response = await api.post('/auth/categories', categoryData);
        return response.data;
    },
    
    updateCategoryStatus: async (id, categoryData) => {
        const response = await api.put(`/auth/categories/${id}`, categoryData);
        return response.data;
    },

    updateCategory: async (id, categoryData) => {
        const response = await api.put(`/auth/categories/${id}/name`, categoryData);
        return response.data;
    },
    
    deleteCategory: async (id) => {
        const response = await api.delete(`/auth/categories/${id}`);
        return response.data;
    },
    
    addSubcategory: async (categoryId, subcategoryData) => {
        const response = await api.post(`/auth/categories/${categoryId}/subcategories`, subcategoryData);
        return response.data;
    },
    
    updateSubcategoryStatus: async (categoryId, subcategoryId, status) => {
        const response = await api.put(
            `/auth/categories/${categoryId}/subcategories/${subcategoryId}`,
            status
        );
        return response.data;
    },

    updateSubCategory: async (categoryId, subcategoryId, subcategoryData) => {
        const response = await api.put(
            `/auth/categories/${categoryId}/subcategories/${subcategoryId}/name`,
            subcategoryData
        );
        return response.data;
    },
    
    deleteSubcategory: async (categoryId, subcategoryId) => {
        const response = await api.delete(
            `/auth/categories/${categoryId}/subcategories/${subcategoryId}`
        );
        return response.data;
    }
};


export const profileServices = {
    getProfile: async () => {
        try {
            const response = await api.get('/auth/users/profile');
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },
    updateProfile: async (profileData) => {
        try {
            const response = await api.put('/auth/users/profile', profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    updateProfilePicture: async (imageUrl) => {
        try {
            const response = await api.put('/auth/users/profile-picture', { imageUrl });
            return response.data;
        } catch (error) {
            console.error('Error updating profile picture:', error);
            throw error;
        }
    },
    getKYC: async (userId) => {
        try {
            const response = await api.get(`/auth/kyc/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching kyc',error)
        }
    }
}

export const KYCService  = {
    getAllDocuments: async () =>{
        try {
            const response = await api.get('/auth/documents');
            return response.data;
        } catch (error) {
            console.error('Error fetching kyc', error)
        }
    },
    searchKYCDocuments: async (query) => {
        try {
            const response = await api.get(`/auth/documents/search?q=${query}`);
            return response.data
        } catch (error) {
            console.error('Error searching', error)
        }
    }
}


export const wishlistService = {
    getWishlist: async (userId) => {
        try {
            const response = await api.get(`/auth/wishlist/${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            throw error;
        }
    },
    addItemToWishlist: async (itemId) => {
        try {
            const response = await api.post('/auth/wishlist', {item: itemId});
            return response;
        } catch (error) {
            console.error('Error adding item to wishlist:', error);
            throw error;
        }
    },
    removeItemFromWishlist: async (itemId) => {
        try {
            console.log('iteminapi:', itemId);
            const response = await api.delete(`/auth/wishlist/${itemId}`);
            return response;
        } catch (error) {
            console.error('Error removing item from wishlist:', error);
            throw error;
        }
    },    
}


export const cartService = {
    getCart: async (userId) => {
        try {
            const response = await api.get(`/auth/cart/${userId}`);
            return response.data;
        } catch (err) {
            console.error('Error fetching cart', err);
            throw err;
        }
    },
    addItemToCart: async (itemId) => {
        try {
            const response = await api.post('/auth/cart', {item: itemId});
            return response.data;
        } catch(error) {
            console.error('Error adding item to cart');
            throw error;
        }
    },
    removeItemFromCart: async (itemId) => {
        try {
            const response = await api.delete(`/auth/cart/${itemId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing item from cart', error);
            throw error;
        }
    },
    clearCart: async () =>{
        try{
            const response =  await api.delete('auth/cart/clear');
            return response.data;
        } catch (error) {
            console.error('failed to clear cart', error);
            throw error;
        }
    }
}

export const addressService = {
    getAddress: async (userId) => {
        try {
            const response = await api.get(`/auth/address/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching address')
        }
    },
    addAddress: async (addressData) => {
        try {
            console.log('api:',addressData);
            const response = await api.post('/auth/address', addressData);
            return response.data;
        } catch (error) {
            console.error('Error adding address', error);
        }
    },
    editAddress: async (addressId, addressData) => {
        try {
            const response = await api.put(`/auth/address/${addressId}`, addressData);
            return response.data;
        } catch (error) {
            console.error('Error editing address', error);
        }
    },
    removeAddess: async (addressId) => {
        try {
            const response = await api.delete(`/auth/address/${addressId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting address', error);
        }
    }
}


export const adminServices = {
    getAllUsers: async () => {
        const response = await api.get('/auth/users');
        return response.data;
    },
    getUserById: async (id) => {
        const response = await api.get(`/auth/users/${id}`);
        return response.data;
    },
    updateUserStatus: async (id, status) => {
        const response = await api.patch(`/auth/users/${id}/status`, {status});
        return response.data;
    },
    deleteUser: async (id) => {
        const response = await api.delete(`/auth/users/${id}`);
        return response.data;
    },
    searchUsers: async (query) => {
        const response = await api.get(`/auth/users/search?q=${query}`);
        return response.data;
    },
    fetchAllActivity: async ()=> {
        const response = await api.get('/auth/activity-log');
        return response.data;
    },
    generateReport: async (params) => {
        const response = await api.get(`/PDF/generate-sales-report?${params}`);
        return response.data
    },
    generateExcelReport: async (params) => {
        const response = await api.get(`/excel/generate-sales-report-excel?${params}`);
        return response.data;
    },
    generateInvoice: async (params) => {
        const response = await api.get(`/invoice/generate-invoice/${params}`);
        return response.data;
    }
}

export const walletService = {
    fetchWallet: async() => {
        const response = await api.get('/wallet/balance');
        return response.data;
    },
    fetchTransactions: async(page, limit) => {
        const response = await api.get(`/wallet/transactions?page=${page}&limit=${limit}`);
        return response.data;
    },
    fetchAllTransactions: async() => {
        const response = await api.get('/wallet/all-transactions');
        return response.data;
    },
    fetchAllWallet: async() => {
        const response = await api.get('/wallet/all-wallet');
        return response.data;
    },
    walletStatus: async(walletId, status) => {
        const response = await api.patch(`/wallet/${walletId}/status`,{isActive: status});
        return response.data;
    },
    addMoney: async({ amount, paymentId, orderId }) => {
        const response = await api.post('/wallet/addmoney', {amount, paymentId, orderId});
        return response.data;
    }
}

export const notificationService = {
    fetchNotification: async () => {
        const response = await api.get('/auth/notifications/unread');
        return response.data;
    },
    markAsRead: async (notifcationId)=> {
        const response = await api.post(`/auth/notifications/${notifcationId}/mark-read`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.post('/auth/notifications/mark-all-read');
        return response.data;
    }
}

export const FAQService = {
    getPopularFAQS: async () => {
        const response = await api.get('/FAQ/popular-questions');
        return response.data;
    },
    searchFAQs: async (query) => {
        const response = await api.get(`/FAQ/searchFAQ/${query}`);
        return response.data;
    },
    suggestions: async (searchQuery) => {
        const response = await api.get(`/FAQ/suggestions/${searchQuery}`);
        return response.data;
    }
}

export default api;