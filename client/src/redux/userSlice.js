import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminServices } from '../utils/api';

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminServices.getAllUsers();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
    'users/updateStatus',
    async ({ userId, newStatus }, { rejectWithValue }) => {
      try {
        const response = await adminServices.updateUserStatus(userId, newStatus);
        // The backend returns { success, message, user }
        if (response.success) {
          return { userId, newStatus: response.user.status };
        } else {
          return rejectWithValue(response.message);
        }
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update status');
      }
    }
  );

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await adminServices.deleteUser(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async (query, { rejectWithValue }) => {
    try {
      const response = await adminServices.searchUsers(query);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const { userId, newStatus } = action.payload;
        state.users = state.users.map(user =>
          user._id === userId ? { ...user, status: newStatus } : user
        );
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user._id !== action.payload);
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      });
  }
});

export default usersSlice.reducer;