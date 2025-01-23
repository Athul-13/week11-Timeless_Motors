import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { profileServices } from '../utils/api';
import { updateUser } from './authSlice';


// Async thunk for updating profile
export const updateProfile = createAsyncThunk(
    'profile/updateProfile',
    async (userData, { dispatch,  rejectWithValue }) => {
      try {
        const response = await profileServices.updateProfile(userData);
        dispatch(updateUser(response));
        return response;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

// Async thunk for updating address
export const updateAddress = createAsyncThunk(
    'profile/updateAddress',
    async (addressData, { rejectWithValue }) => {
      try {
        const response = await profileServices.updateAddress(addressData);
        return response;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update address');
      }
    }
);

// Add new thunk for updating profile picture
export const updateProfilePicture = createAsyncThunk(
    'profile/updateProfilePicture',
    async (imageUrl, { dispatch, rejectWithValue }) => {
      try {
        const response = await profileServices.updateProfilePicture(imageUrl);
        dispatch(updateUser(response));
        return response;
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update profile picture');
      }
    }
  );
  

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    formData: {
      first_name: '',
      last_name: '',
      email: '',
      phone_no: '',
      address: {
        street: '',
        town: '',
        state: '',
        postal_code: '',
        country: ''
      }
    },
    loading: false,
    error: null,
    isFormChanged: false
  },
  reducers: {
    updateFormData: (state, action) => {
      if (action.payload.path.includes('address.')) {
        const field = action.payload.path.split('.')[1];
        state.formData.address[field] = action.payload.value;
      } else {
        state.formData[action.payload.path] = action.payload.value;
      }
      state.isFormChanged = true;
    },
    resetForm: (state, action) => {
      state.formData = action.payload;
      state.isFormChanged = false;
      state.error = null;
    },
    setIsFormChanged: (state, action) => {
      state.isFormChanged = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Profile cases
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.formData = { ...state.formData, ...action.payload };
        state.isFormChanged = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Address cases
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.formData.address = action.payload;
        state.isFormChanged = false;
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { updateFormData, resetForm, setIsFormChanged } = profileSlice.actions;
export default profileSlice.reducer;