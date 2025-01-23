import { AlertCircle, CheckCircle2, Plus, Upload, X } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from "react-router-dom";
import { addImages, removeImage, resetForm, updateFormField, setFormData } from '../../redux/listingSlice';
import { listingService } from "../../utils/api";
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../../redux/categorySlice";

const AdminAddListingForm = () => {
  const { listingId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formData = useSelector((state) => state.listing.formData);
  const categories = useSelector((state) => state.categories.categories);
  const [isLoading, setIsLoading] = useState(true);

  const CLOUD_NAME = 'dncoxucat';
  const UPLOAD_PRESET = 'listing_images';

  const isEditMode = Boolean(listingId);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await dispatch(fetchCategories()).unwrap();
      } catch (error) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Failed to load categories</span>
          </div>
        );
      }
    };
    loadCategories();
  }, [dispatch]);

  useEffect(() => {
    const loadListingData = async () => {
      console.log('Current listingId:', listingId);
      console.log('Is Edit Mode:', isEditMode);

      if (!isEditMode) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading listing with ID:', listingId);
        const listing = await listingService.getListingById(listingId);
        console.log('Received listing data:', listing);
        dispatch(setFormData(listing.data));
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Listing data loaded successfully</span>
          </div>
        );
      } catch (error) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Failed to load listing data</span>
          </div>
        );
        navigate('/admin/auctions');
      } finally {
        setIsLoading(false);
      }
    };

    loadListingData();

    return () => {
      dispatch(resetForm());
    };
  }, [dispatch, listingId, navigate, isEditMode]);

  const categorizedOptiions = useMemo(() => {
    if (!categories?.length) {
      return {
        makes: [],
        transmissions: [],
        fuels: [],
        listingTypes: []
      };
    }

    const makeCategory = categories.find(cat => cat.name.toLowerCase() === 'make');
    const transmissionCategory = categories.find(cat => cat.name.toLowerCase() === 'transmission');
    const fuelCategory = categories.find(cat => cat.name.toLowerCase() === 'fuel type');
    const listingCategory = categories.find(cat => cat.name.toLowerCase() === 'listing type');

    return {
      makes: makeCategory?.subCategories || [],
      transmissions: transmissionCategory?.subCategories || [],
      fuels: fuelCategory?.subCategories || [],
      listingTypes: listingCategory?.subCategories || []
    };
  }, [categories]);

  const isAuction = formData.type?.toLowerCase() === 'auction';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isLoading || !categories?.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (e.target.tagName === 'SELECT') {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const actualValue = selectedOption.getAttribute('data-name') || value;
      dispatch(updateFormField({ name, value: actualValue }));
    } else {
      dispatch(updateFormField({ name, value }));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file',file);
    formData.append('upload_preset',UPLOAD_PRESET);

    try{
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);

      return {
        url: data.secure_url,
        public_id: data.public_id,
        name: file.name,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const toastId = toast.loading(<div className="flex items-center gap-2"><Upload className="animate-bounce" size={18} /><span>Uploading images...</span></div>);
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        failCount++;
        continue;
      }

      try {
        const imageData = await uploadToCloudinary(file);
        dispatch(addImages([imageData]));
        successCount++;
      } catch (error) {
        console.error('Error processing image:', error);
        failCount++;
      }
    }

    toast.dismiss(toastId);

    if (successCount > 0) {
      toast.success(<div className="flex items-center gap-2"><CheckCircle2 size={18} /><span>{`Successfully uploaded ${successCount} ${successCount === 1 ? 'image' : 'images'}`}</span></div>);
    }

    if (failCount > 0) {
      toast.error(<div className="flex items-center gap-2"><AlertCircle size={18} /><span>{`Failed to upload ${failCount} ${failCount === 1 ? 'image' : 'images'}`}</span></div>);
    }
  };

  const deleteImage = (index) => {
    dispatch(removeImage(index));
    toast(
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} />
        <span>Image removed</span>
      </div>
    );
  };

  const handleDiscard = () => {
    navigate(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length < 3) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle size={18} />
          <span>Please add at least 3 images</span>
        </div>
      );
      return;
    }

    const toastId = toast.loading(
      <div className="flex items-center gap-2">
        <Upload className="animate-bounce" size={18} />
        <span>{isEditMode ? 'Updating' : 'Creating'} listing...</span>
      </div>
    );

    try {
      const transformedData = {
        ...formData,
        images: formData.images.map(img => ({
          url: img.url,
          public_id: img.public_id
        }))
      };

      let response;
      if (isEditMode) {
        response = await listingService.updateListing(listingId, transformedData);
      } else {
        response = await listingService.addListing(transformedData);
      }

      toast.dismiss(toastId);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>Listing {isEditMode ? 'updated' : 'created'} successfully!</span>
        </div>
      );
      dispatch(resetForm());
      navigate('/admin/auctions');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{err.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`}</span>
        </div>
      );
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto my-10 p-6 bg-gray-300">
        <h1 className="text-xl font-bold mb-4">
        {isEditMode ? 'Edit Listing' : 'Add some basic details'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Make*</label>
              <select
              name="make"
              value={formData.make}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              required
            >
              <option value="">Select Make</option>
              {categorizedOptiions?.makes?.map((make) => (
                <option key={make._id} value={make.name} data-name={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Model*</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Year*</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Engine Capacity (CC)*</label>
              <input
                type="number"
                name="cc_capacity"
                value={formData.cc_capacity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Body Type*</label>
              <select
                name="body_type"
                value={formData.body_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              >
                <option value="">Select Body Type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Coupe">Coupe</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Contact Number*</label>
              <input
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Transmission Type*</label>
              <select
              name="transmission_type"
              value={formData.transmission_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              required
            >
              <option value="">Select Transmission</option>
              {categorizedOptiions?.transmissions?.map((transmission) => (
                <option key={transmission._id} value={transmission.name} data-name={transmission.name}>
                  {transmission.name}
                </option>
              ))}
            </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Fuel Type*</label>
              <select
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              required
            >
              <option value="">Select Fuel Type</option>
              {categorizedOptiions?.fuels?.map((fuel) => (
                <option key={fuel._id} value={fuel.name} data-name={fuel.name}>
                  {fuel.name}
                </option>
              ))}
            </select>
            </div>
            <div>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-400 rounded"
              required
            >
              <option value="">Select listing type</option>
              {categorizedOptiions?.listingTypes?.map((listing) => (
                <option key={listing._id} value={listing.name} data-name={listing.name}>
                  {listing.name}
                </option>
              ))}
            </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                {isAuction ? 'Starting Bid' : 'Price'}*
              </label>
              <input
                type="number"
                name="starting_bid"
                value={formData.starting_bid}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
                min="0"
              />
            </div>
            {isAuction && (
              <div>
                <label className="block text-sm font-medium">Minimum Increment*</label>
                <input
                  type="number"
                  name="minimum_increment"
                  value={formData.minimum_increment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-400 rounded"
                  required
                  min="0"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium">Description*</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded h-40"
                required
              ></textarea>
            </div>
          </div>
        </div>

        {/* Date Selection - Only show for Auction */}
        {isAuction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Start Date*</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date*</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              />
            </div>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">
            Add images: minimum 3*
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative h-20">
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => deleteImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {formData.images.length < 6 && (
              <label className="flex items-center justify-center h-20 bg-gray-200 border border-gray-400 rounded cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Plus size={24} />
              </label>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-6 py-2 bg-gray-700 text-white rounded shadow-sm hover:bg-gray-600"
          >
            Discard
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded shadow-sm hover:bg-gray-900"
          >
            {isEditMode ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminAddListingForm;