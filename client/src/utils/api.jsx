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
            secure: false,
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
    logout: () => {
        Cookies.remove('token', { path: '/' });
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
        const response = await api.get('/auth/listings');
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
    updateUser: async (id, userData) => {
        const response = await api.put(`/auth/users/${id}/edit`, userData);
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
    createUser: async (userData) => {
        const response = await api.post('/auth/signup', userData); 
        return response.data; 
    }
};

export default api;