import categoryReducer from './categorySlice';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import listingReducer from './listingSlice';
import profileReducer from './profileSlice';
import usersReducer from "./userSlice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        listing: listingReducer,
        categories: categoryReducer,
        profile: profileReducer,
        users: usersReducer
    },

    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoreActions: ['auth/setCredentials'],
            },
        }),
});


