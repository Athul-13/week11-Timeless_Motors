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
    type: 'Fixed price',
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
    setFormData(state, action) {
      const formattedData = {
        ...action.payload,
        start_date: action.payload.start_date ? new Date(action.payload.start_date).toISOString().slice(0, 16) : '',
        end_date: action.payload.end_date ? new Date(action.payload.end_date).toISOString().slice(0, 16) : '',
      };
      state.formData = formattedData;
    },
  },
});

export const { updateFormField, addImages, removeImage, resetForm, setFormData } = listingSlice.actions;

export default listingSlice.reducer;
