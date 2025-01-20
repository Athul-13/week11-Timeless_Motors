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
        const response = await api.post('/logout');
        Cookies.remove('token', { path: '/' });
        return response.data;
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
        const response = await api.get(`/auth/listings/${id}`);
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