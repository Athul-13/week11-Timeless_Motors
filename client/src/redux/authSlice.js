import { createSlice } from "@reduxjs/toolkit";
import Cookies from 'js-cookie';

const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isAdmin: false,
};

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

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { token, user } = action.payload;
            state.token = token;
            state.user = {
                ...user,
                profilePicture: user.profilePicture || null
            };
            state.isAuthenticated = true;
            state.isAdmin = user && user.role === 'admin';

            Cookies.set('token', token, {
              expires: 7,
              secure: true,
              sameSite: 'strict',
              path: '/'
            });
            Cookies.set('user', JSON.stringify(user), {
              expires: 7,
              secure: true,
              sameSite: 'strict',
              path: '/'
            });


            console.log('Auth state updated:', {
                isAuthenticated: true,
                isAdmin: user.role === 'admin',
                hasToken: !!token
            });
          },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isAdmin = false;

            Cookies.remove('token', { path: '/' });
            Cookies.remove('user', { path: '/' });

            console.log('successfully logged out');

        },
    }
});

export const { setCredentials, logout} = authSlice.actions;
export default authSlice.reducer;