import categoryReducer from './categorySlice';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import listingReducer from './listingSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        listing: listingReducer,
        categories: categoryReducer
    },

    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoreActions: ['auth/setCredentials'],
            },
        }),
});


