import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createCategory, addSubcategory, fetchCategories } from '../../redux/categorySlice';
import toast, { Toaster } from 'react-hot-toast';

const AddCategory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    status: true,
    parentCategoryId: ''
  });

  const [isSubcategory, setIsSubcategory] = useState(false);
  const [error, setError] = useState('');

  const categories = useSelector((state) => state.categories.categories)

  useEffect(() => {
    dispatch(fetchCategories());
  },[dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a loading toast that we can dismiss later
    const loadingToast = toast.loading(
      isSubcategory ? 'Creating subcategory...' : 'Creating category...'
    );

    try {
      if (isSubcategory) {
        await dispatch(addSubcategory({
          categoryId: formData.parentCategoryId,
          subcategoryData: {
            name: formData.name,
            status: formData.status
          }
        })).unwrap();
  
      } else {
        await dispatch(createCategory({
          name: formData.name,
          status: formData.status
        })).unwrap();
      }
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        isSubcategory 
          ? 'Subcategory created successfully!' 
          : 'Category created successfully!'
      );
      
      navigate('/admin/categories');
    } catch (err) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);
      toast.error(err.message || 'An error occurred while saving');
      setError(err.message || 'An error occurred while saving');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Toaster position='top-center'/>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {isSubcategory ? 'Add New Subcategory' : 'Add New Category'}
        </h1>
        <p className="text-gray-600 mt-2">
          Fill in the details below to create a new {isSubcategory ? 'subcategory' : 'category'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={!isSubcategory}
                onChange={() => setIsSubcategory(false)}
                className="text-gray-600 focus:ring-gray-500"
              />
              <span className="ml-2">Main Category</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                checked={isSubcategory}
                onChange={() => setIsSubcategory(true)}
                className="text-gray-600 focus:ring-gray-500"
              />
              <span className="ml-2">Subcategory</span>
            </label>
          </div>
        </div>

        {isSubcategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentCategoryId}
              onChange={(e) => setFormData({
                ...formData,
                parentCategoryId: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
              required
            >
              <option value="">Select parent category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({
              ...formData,
              name: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.status}
              onChange={(e) => setFormData({
                ...formData,
                status: e.target.checked
              })}
              className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
            />
            <span className="ml-2 text-sm text-gray-600">Active Status</span>
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/categories')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;