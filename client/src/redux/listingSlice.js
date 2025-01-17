import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  formData: {
    description: '',
    make: '',
    model: '',
    year: '',
    fuel_type: '',
    transmission_type: '',
    body_type: '',
    cc_capacity: '',
    contact_number: '',
    starting_bid: '',
    minimum_increment: '',
    type: 'Auction',
    start_date: '',
    end_date: '',
    images: [],
  },
};

const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    updateFormField(state, action) {
      const { name, value } = action.payload;
      state.formData[name] = value;
    },
    addImages(state, action) {
        state.formData.images.push(...action.payload);
    },
    removeImage(state, action) {
      state.formData.images = state.formData.images.filter((_, index) => index !== action.payload);
    },
    resetForm(state) {
      state.formData = initialState.formData;
    },
  },
});

export const { updateFormField, addImages, removeImage, resetForm } = listingSlice.actions;

export default listingSlice.reducer;
