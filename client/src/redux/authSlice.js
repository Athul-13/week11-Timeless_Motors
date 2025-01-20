import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from 'js-cookie';

// Helper function to clear all auth-related cookies
const clearAllAuthCookies = () => {
  // Get all cookies
  const cookies = Cookies.get();
  
  // Get current domain
  const domain = window.location.hostname;
  const paths = ['/', '/api', '/auth'];
  
  // Clear cookies across all paths
  paths.forEach(path => {
    // Clear your app's auth cookies
    Cookies.remove('token', { path, domain });
    Cookies.remove('user', { path, domain });
    
    // Clear Google auth cookies
    Cookies.remove('g_state', { path, domain });
    
    // Clear other potential auth cookies
    Object.keys(cookies).forEach(cookieName => {
      if (cookieName.startsWith('g_') || 
          cookieName.includes('google') || 
          cookieName.includes('auth') ||
          cookieName.includes('token')) {
        Cookies.remove(cookieName, { path, domain });
      }
    });
  });

  // Clear cookies on base domain and subdomains
  Cookies.remove('token', { domain: `.${domain}` });
  Cookies.remove('user', { domain: `.${domain}` });
};

const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isAdmin: false,
};

// Load initial state from cookies
const loadFromCookies = () => {
    try {
        const token = Cookies.get('token');
        const user = Cookies.get('user');
        
        if (user) {
            const parsedUser = JSON.parse(user);
            initialState.user = {
                ...parsedUser,
                profilePicture: parsedUser.profilePicture || null
            };
            initialState.isAuthenticated = true;
            initialState.isAdmin = parsedUser.role === 'admin';
        }

        if (token) {
            initialState.token = token;
        }
    } catch (error) {
        console.error("Error loading from cookies:", error);
    }
};

loadFromCookies();

// Create async thunk for setting credentials
export const setCredentials = createAsyncThunk(
    'auth/setCredentials',
    async (credentials) => {
        const { token, user } = credentials;
        
        // Set token cookie
        if (token) {
            console.log('Setting token in cookie:', token);
            Cookies.set('token', token, {
                expires: 7,
                secure: import.meta.env.MODE === 'production',
                sameSite: 'strict',
                path: '/'
            });
            
            // Verify cookie was set
            const savedToken = Cookies.get('token');
            console.log('Verified saved token:', savedToken);
        }

        // Set user cookie
        if (user) {
            Cookies.set('user', JSON.stringify(user), {
                expires: 7,
                secure: import.meta.env.MODE === 'production',
                sameSite: 'strict',
                path: '/'
            });
        }

        return credentials;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isAdmin = false;

            clearAllAuthCookies();

            // Clean up Google Auth if it exists
            if (window.google?.accounts?.id) {
                window.google.accounts.id.disableAutoSelect();
            }

            // Clear any local/session storage
            localStorage.removeItem('user');
            sessionStorage.clear();

            console.log('Successfully logged out and cleared all auth data');
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(setCredentials.pending, (state) => {
                console.log('Setting credentials...');
            })
            .addCase(setCredentials.fulfilled, (state, action) => {
                const { token, user } = action.payload;
                state.token = token;
                state.user = {
                    ...user,
                    profilePicture: user.profilePicture || null
                };
                state.isAuthenticated = true;
                state.isAdmin = user && user.role === 'admin';

                console.log('Auth state updated:', {
                    isAuthenticated: true,
                    isAdmin: user.role === 'admin',
                    hasToken: !!token,
                    tokenValue: token
                });
            })
            .addCase(setCredentials.rejected, (state, action) => {
                console.error('Failed to set credentials:', action.error);
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;