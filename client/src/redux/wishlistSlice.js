import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { wishlistService } from '../utils/api';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue, getState }) => {
    try {
        const { auth } = getState();
        if (!auth.user) {
            throw new Error('User not authenticated');
        }
        const response = await wishlistService.getWishlist(auth.user.id);
        return response.data
    } catch (error) {
        return rejectWithValue(error.message || 'Something went wrong');
    }
  }
);

export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async (item, { rejectWithValue }) => {
    try {
      return await wishlistService.addItemToWishlist(item);
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (itemId, { rejectWithValue }) => {
    try {
      await wishlistService.removeItemFromWishlist(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload) ? action.payload : [];
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        const existingItem = state.items.find(item => item.id === action.payload.id);
        if (!existingItem) {
          state.items.push(action.payload);
        }
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
      });
  }
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;