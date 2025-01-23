import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:5000/api'

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

export const authService = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        // Set cookie with optional configuration
        Cookies.set('token', response.data.accessToken, {
            expires: 7, // expires in 7 days
            secure: import.meta.env.MODE === 'production',
            sameSite: 'strict', // protect against CSRF
            path: '/' // accessible across all pages
        });
        console.log('Token set:', Cookies.get('token'));
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
    resendOTP: async (email) => {
        const response = await api.post('/auth/resendOTP', {email});
        return response.data
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
    }
};


export const listingService = {
    addListing: async (listingData) => {
        try {
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
            console.log('id:',id);
            const response = await api.get(`/auth/listings/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error getting listing:', error);
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
    
    updateCategory: async (id, categoryData) => {
        const response = await api.put(`/auth/categories/${id}`, categoryData);
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
    
    updateSubcategory: async (categoryId, subcategoryId, status) => {
        console.log('api:',subcategoryId);
        const response = await api.put(
            `/auth/categories/${categoryId}/subcategories/${subcategoryId}`,
            status
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
    updateAddress: async (addressData) => {
        try {
            const response = await api.put('/auth/users/address', addressData);
            return response.data;
        } catch (error) {
            console.error('Error updating address:', error);
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
}


export default api;