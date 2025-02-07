import categoryReducer from './categorySlice';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import listingReducer from './listingSlice';
import profileReducer from './profileSlice';
import usersReducer from "./userSlice"
import wishlistReducer from "./wishlistSlice";
import cartReducer from "./cartSlice";
import addressReducer from "./addressSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        listing: listingReducer,
        categories: categoryReducer,
        profile: profileReducer,
        address: addressReducer,
        users: usersReducer,
        wishlist: wishlistReducer,
        cart: cartReducer,
    },

    middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
            serializableCheck: {
                ignoreActions: ['auth/setCredentials'],
            },
        }),
});


