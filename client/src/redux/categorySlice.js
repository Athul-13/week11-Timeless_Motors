import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { categoryService } from '../utils/api';

// Async thunks
export const fetchCategories = createAsyncThunk(
    'categories/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            return await categoryService.getAllCategories();
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch categories');
        }
    }
);

export const createCategory = createAsyncThunk(
    'categories/create',
    async (categoryData, { rejectWithValue }) => {
        try {
            return await categoryService.createCategory(categoryData);
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to create category');
        }
    }
);

export const updateCategory = createAsyncThunk(
    'categories/update',
    async ({ id, categoryData }, { rejectWithValue }) => {
        try {
            return await categoryService.updateCategory(id, categoryData);
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update category');
        }
    }
);

export const deleteCategory = createAsyncThunk(
    'categories/delete',
    async (id, { rejectWithValue }) => {
        try {
            await categoryService.deleteCategory(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete category');
        }
    }
);

export const addSubcategory = createAsyncThunk(
    'categories/addSubcategory',
    async ({ categoryId, subcategoryData }, { rejectWithValue }) => {
        try {
            return await categoryService.addSubcategory(categoryId, subcategoryData);
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to add subcategory');
        }
    }
);

export const updateSubcategory = createAsyncThunk(
    'categories/updateSubcategory',
    async ({ categoryId, subcategoryId, status }, { rejectWithValue }) => {
        try {
            return await categoryService.updateSubcategory(categoryId, subcategoryId, status);
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to update subcategory');
        }
    }
);

export const deleteSubcategory = createAsyncThunk(
    'categories/deleteSubcategory',
    async ({ categoryId, subcategoryId }, { rejectWithValue }) => {
        try {
            await categoryService.deleteSubcategory(categoryId, subcategoryId);
            return { categoryId, subcategoryId };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to delete subcategory');
        }
    }
);

const initialState = {
    categories: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    selectedCategory: null
};

const categorySlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Categories
            .addCase(fetchCategories.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = action.payload.data;
                state.error = null;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            
            // Create Category
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.push(action.payload);
                state.error = null;
            })
            
            // Update Category
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(cat => cat._id === action.payload._id);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
                state.error = null;
            })
            
            // Delete Category
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(cat => cat._id !== action.payload);
                state.error = null;
            })
            
            // Add Subcategory
            .addCase(addSubcategory.fulfilled, (state, action) => {
                const category = state.categories.find(cat => cat._id === action.payload.categoryId);
                if (category) {
                    category.subCategories.push(action.payload.subcategory);
                }
                state.error = null;
            })
            
            // Update Subcategory
            .addCase(updateSubcategory.fulfilled, (state, action) => {
                const category = state.categories.find(cat => cat._id === action.payload.categoryId);
                if (category) {
                    const subIndex = category.subCategories.findIndex(
                        sub => sub._id === action.payload.subcategory._id
                    );
                    if (subIndex !== -1) {
                        category.subCategories[subIndex] = action.payload.subcategory;
                    }
                }
                state.error = null;
            })
            
            // Delete Subcategory
            .addCase(deleteSubcategory.fulfilled, (state, action) => {
                const category = state.categories.find(cat => cat._id === action.payload.categoryId);
                if (category) {
                    category.subCategories = category.subCategories.filter(
                        sub => sub._id !== action.payload.subcategoryId
                    );
                }
                state.error = null;
            });
    }
});

export const { setSelectedCategory, clearError } = categorySlice.actions;

// Selectors
export const selectAllCategories = (state) => state.categories.categories;
export const selectCategoryStatus = (state) => state.categories.status;
export const selectCategoryError = (state) => state.categories.error;
export const selectSelectedCategory = (state) => state.categories.selectedCategory;

export default categorySlice.reducer;