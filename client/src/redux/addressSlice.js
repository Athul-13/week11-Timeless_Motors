import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addressService } from '../utils/api';

const STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed'
};

export const fetchAddresses = createAsyncThunk(
    'address/fetchAddresses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await addressService.getAddress();
            console.log('res:',response);
            return response
        } catch (error) {
            return rejectWithValue({
                message: error.message,
                statusCode: error.statusCode,
                data: error.data
            });
        }
    }
);

export const addAddress = createAsyncThunk(
    'address/addAddress',
    async (addressData, { rejectWithValue }) => {
        try {
            console.log('object', addressData);
            return await addressService.addAddress(addressData);
        } catch (error) {
            return rejectWithValue({
                message: error.message,
                statusCode: error.statusCode,
                data: error.data
            });
        }
    }
);

export const editAddress = createAsyncThunk(
    'address/editAddress',
    async ({ addressId, addressData }, { rejectWithValue }) => {
        try {
            return await addressService.editAddress(addressId, addressData);
        } catch (error) {
            return rejectWithValue({
                message: error.message,
                statusCode: error.statusCode,
                data: error.data
            });
        }
    }
);

export const removeAddress = createAsyncThunk(
    'address/removeAddress',
    async (addressId, { rejectWithValue }) => {
        try {
            await addressService.removeAddress(addressId);
            return addressId;
        } catch (error) {
            return rejectWithValue({
                message: error.message,
                statusCode: error.statusCode,
                data: error.data
            });
        }
    }
);

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        addresses: [],
        status: STATUS.IDLE,
        error: null,
        currentAddress: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload;
        },
        clearCurrentAddress: (state) => {
            state.currentAddress = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch addresses
            .addCase(fetchAddresses.pending, (state) => {
                state.status = STATUS.LOADING;
                state.error = null;
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.status = STATUS.SUCCEEDED;
                state.addresses = action.payload;
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.status = STATUS.FAILED;
                state.error = action.payload;
            })
            // Add address
            .addCase(addAddress.pending, (state) => {
                state.status = STATUS.LOADING;
                state.error = null;
            })
            .addCase(addAddress.fulfilled, (state, action) => {
                state.status = STATUS.SUCCEEDED;
                state.addresses.push(action.payload);
            })
            .addCase(addAddress.rejected, (state, action) => {
                state.status = STATUS.FAILED;
                state.error = action.payload;
            })
            // Edit address
            .addCase(editAddress.pending, (state) => {
                state.status = STATUS.LOADING;
                state.error = null;
            })
            .addCase(editAddress.fulfilled, (state, action) => {
                state.status = STATUS.SUCCEEDED;
                const index = state.addresses.findIndex(addr => addr._id === action.payload._id);
                if (index !== -1) {
                    state.addresses[index] = action.payload;
                }
            })
            .addCase(editAddress.rejected, (state, action) => {
                state.status = STATUS.FAILED;
                state.error = action.payload;
            })
            // Remove address
            .addCase(removeAddress.pending, (state) => {
                state.status = STATUS.LOADING;
                state.error = null;
            })
            .addCase(removeAddress.fulfilled, (state, action) => {
                state.status = STATUS.SUCCEEDED;
                state.addresses = state.addresses.filter(addr => addr._id !== action.payload);
            })
            .addCase(removeAddress.rejected, (state, action) => {
                state.status = STATUS.FAILED;
                state.error = action.payload;
            });
    }
});

export const { clearError, setCurrentAddress, clearCurrentAddress } = addressSlice.actions;
export default addressSlice.reducer;