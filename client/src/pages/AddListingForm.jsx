import { Plus, X } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { addImages, removeImage, resetForm, updateFormField } from '../redux/listingSlice';
import { listingService } from "../utils/api";
import { useEffect, useMemo } from "react";
import { fetchCategories } from "../redux/categorySlice";

const AddListingForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formData = useSelector((state)=> state.listing.formData)
  const categories = useSelector((state)=> state.categories.categories);

  const CLOUD_NAME = 'dncoxucat';
  const UPLOAD_PRESET = 'listing_images';

    useEffect(()=>{
      dispatch(fetchCategories());
    },[dispatch]);
  
    const categorizedOptiions = useMemo(()=>{
      const makeCategory = categories.find(cat=> cat.name.toLowerCase() === 'make');
      const transmissionCategory = categories.find(cat => cat.name.toLowerCase() === 'transmission');
      const fuelCategory = categories.find(cat => cat.name.toLowerCase() === 'fuel type');
      const listingCategory = categories.find(cat => cat.name.toLowerCase() === 'listing type');
  
      return {
        makes: makeCategory?.subCategories || [],
        transmissions: transmissionCategory?.subCategories || [],
        fuels: fuelCategory?.subCategories || [],
        listingTypes: listingCategory?.subCategories || []
      };
    },[categories]);

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

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        continue;
      }

      try {
        const imageData = await uploadToCloudinary(file);
        dispatch(addImages([imageData]));
      } catch (error) {
        console.error('Error processing image:', error);
        alert(`Failed to upload image ${file.name}`);
      }   
    }
  };

  const deleteImage = (index) => {
    dispatch(removeImage(index))
  }

  const handleDiscard = () => {
    navigate('/listings');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.images.length < 3) {
      alert('Please add at least 3 images');
      return;
    }

    try {
      const transformedData = {
        ...formData,
        images: formData.images.map(img => ({
          url: img.url,
          public_id: img.public_id
        }))
      };

      const response = await listingService.addListing(transformedData);
      console.log('Listing created successfully:', response);
      dispatch(resetForm());
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Failed to create listing: ' + err.message);
    }
  }

  return (
    <>
      <Navbar />
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto my-10 p-6 bg-gray-300">
        <h1 className="text-xl font-bold mb-4">Add some basic details</h1>
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
                {categorizedOptiions.makes.map((make) => (
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
                {categorizedOptiions.transmissions.map((transmission) => (
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
                {categorizedOptiions.fuels.map((fuel) => (
                <option key={fuel._id} value={fuel.name} data-name={fuel.name}>
                  {fuel.name}
                </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Listing Type*</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-400 rounded"
                required
              >
                <option value="">Select listing type</option>
                {categorizedOptiions.listingTypes.map((listing) => (
                <option key={listing._id} value={listing.name} data-name={listing.name}>
                  {listing.name}
                </option>
              ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Starting Bid/Price*</label>
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

        {/* Date Selection */}
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
            className="px-6 py-2 bg-gray-700 text-white rounded shadow-sm hover:bg-gray-600"
          >
            Discard
          </button>
          <button
            type="submit"
            onClick={handleDiscard}
            className="px-6 py-2 bg-black text-white rounded shadow-sm hover:bg-gray-900"
          >
            Add listing
          </button>
        </div>
      </form>
      <Footer />
    </>
  );
};

export default AddListingForm;