import { AlertCircle, CheckCircle2, Plus, Upload, X, CheckCircle, XCircle } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from "react-router-dom";
import { addImages, removeImage, resetForm, updateFormField, setFormData } from '../../redux/listingSlice';
import { listingService } from "../../utils/api";
import toast, { Toaster } from 'react-hot-toast';
import { useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../../redux/categorySlice";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";

// Define validation schema
const listingSchema = Joi.object({
  make: Joi.string().required().messages({
    'string.empty': 'Make is required',
    'any.required': 'Make is required'
  }),
  model: Joi.string().required().messages({
    'string.empty': 'Model is required',
    'any.required': 'Model is required'
  }),
  year: Joi.number().integer().min(1700).max(new Date().getFullYear()).required().messages({
    'number.base': 'Year must be a number',
    'number.min': `Year must be at least 1700`,
    'number.max': `Year must be no more than ${new Date().getFullYear()}`,
    'any.required': 'Year is required'
  }),
  cc_capacity: Joi.number().positive().required().messages({
    'number.base': 'Engine capacity must be a number',
    'number.positive': 'Engine capacity must be positive',
    'any.required': 'Engine capacity is required'
  }),
  body_type: Joi.string().required().messages({
    'string.empty': 'Body type is required',
    'any.required': 'Body type is required'
  }),
  contact_number: Joi.string().pattern(/^[0-9+\s-]{10,15}$/).required().messages({
    'string.pattern.base': 'Please enter a valid phone number',
    'string.empty': 'Contact number is required',
    'any.required': 'Contact number is required'
  }),
  transmission_type: Joi.string().required().messages({
    'string.empty': 'Transmission type is required',
    'any.required': 'Transmission type is required'
  }),
  fuel_type: Joi.string().required().messages({
    'string.empty': 'Fuel type is required',
    'any.required': 'Fuel type is required'
  }),
  type: Joi.string().required().messages({
    'string.empty': 'Listing type is required',
    'any.required': 'Listing type is required'
  }),
  starting_bid: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price must be at least 0',
    'any.required': 'Price is required'
  }),
  minimum_increment: Joi.when('type', {
    is: Joi.string().valid('Auction'),
    then: Joi.number().min(0).required().messages({
      'number.base': 'Minimum increment must be a number',
      'number.min': 'Minimum increment must be at least 0',
      'any.required': 'Minimum increment is required for auctions'
    }),
    otherwise: Joi.optional()
  }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters',
    'any.required': 'Description is required'
  }),
  start_date: Joi.when('type', {
    is: Joi.string().valid('Auction'),
    then: Joi.date().iso().required().messages({
      'date.base': 'Start date must be a valid date',
      'any.required': 'Start date is required for auctions'
    }),
    otherwise: Joi.optional()
  }),
  end_date: Joi.when('type', {
    is: Joi.string().valid('Auction'),
    then: Joi.date().iso().greater(Joi.ref('start_date')).required().messages({
      'date.base': 'End date must be a valid date',
      'date.greater': 'End date must be after start date',
      'any.required': 'End date is required for auctions'
    }),
    otherwise: Joi.optional()
  }),
  images: Joi.array().min(3).messages({
    'array.min': 'At least 3 images are required'
  })
});

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

  const { 
    register, 
    handleSubmit, 
    formState: { errors, dirtyFields, isValid, touchedFields }, 
    watch,
    setValue,
    trigger,
    reset
  } = useForm({
    resolver: joiResolver(listingSchema),
    mode: "onChange",
    defaultValues: formData
  });

  // Sync form state with Redux
  useEffect(() => {
    if (formData) {
      Object.keys(formData).forEach(key => {
        if (key !== 'images') {
          setValue(key, formData[key], { shouldValidate: true, shouldDirty: true });
        }
      });
      setValue('images', formData.images || [], { shouldValidate: true });
    }
  }, [formData, setValue]);

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
        const listing = await listingService.getListingById(listingId);
        dispatch(setFormData(listing.data));
        reset(listing.data);
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
  }, [dispatch, listingId, navigate, isEditMode, reset]);

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

  const isAuction = watch('type')?.toLowerCase() === 'auction';

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

  // Validation indicator component
  const ValidationIndicator = ({ field }) => {
    const isDirty = dirtyFields[field];
    const hasError = !!errors[field];
    const isTouched = touchedFields[field];
    
    if (!isDirty) return null;
    
    return (
      <div className="absolute right-12 top-1/2">
        {hasError ? (
          <XCircle size={16} className="text-red-500" />
        ) : (
          <CheckCircle size={16} className="text-green-500" />
        )}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (e.target.tagName === 'SELECT') {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const actualValue = selectedOption.getAttribute('data-name') || value;
      dispatch(updateFormField({ name, value: actualValue }));
      setValue(name, actualValue, { shouldValidate: true });
    } else {
      dispatch(updateFormField({ name, value }));
      setValue(name, value, { shouldValidate: true });
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
      // Validate images after upload
      trigger('images');
    }

    if (failCount > 0) {
      toast.error(<div className="flex items-center gap-2"><AlertCircle size={18} /><span>{`Failed to upload ${failCount} ${failCount === 1 ? 'image' : 'images'}`}</span></div>);
    }
  };

  const deleteImage = (index) => {
    dispatch(removeImage(index));
    trigger('images');
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

  const onSubmit = async (data) => {
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
        ...data,
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
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto my-10 p-6 bg-gray-300">
        <h1 className="text-xl font-bold mb-4">
        {isEditMode ? 'Edit Listing' : 'Add some basic details'}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium">Make*</label>
              <select
                {...register("make")}
                value={watch('make') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.make ? 'border-red-500' : 'border-gray-400'} rounded`}
              >
                <option value="">Select Make</option>
                {categorizedOptiions?.makes?.map((make) => (
                  <option key={make._id} value={make.name} data-name={make.name}>
                    {make.name}
                  </option>
                ))}
              </select>
              <ValidationIndicator field="make" />
              {errors.make && touchedFields.make && (
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.make.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Model*</label>
              <input
                type="text"
                {...register("model")}
                value={watch('model') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.model ? 'border-red-500' : 'border-gray-400'} rounded`}
              />
              <ValidationIndicator field="model" />
              {errors.model && touchedFields.model &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.model.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Year*</label>
              <input
                type="number"
                {...register("year")}
                value={watch('year') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.year ? 'border-red-500' : 'border-gray-400'} rounded`}
                min="1900"
                max={new Date().getFullYear()}
              />
              <ValidationIndicator field="year" />
              {errors.year && touchedFields.year &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.year.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Engine Capacity (CC)*</label>
              <input
                type="number"
                {...register("cc_capacity")}
                value={watch('cc_capacity') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.cc_capacity ? 'border-red-500' : 'border-gray-400'} rounded`}
              />
              <ValidationIndicator field="cc_capacity" />
              {errors.cc_capacity && touchedFields.cc_capacity &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.cc_capacity.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Body Type*</label>
              <select
                {...register("body_type")}
                value={watch('body_type') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.body_type ? 'border-red-500' : 'border-gray-400'} rounded`}
              >
                <option value="">Select Body Type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Coupe">Coupe</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Convertible">Convertible</option>
              </select>
              <ValidationIndicator field="body_type" />
              {errors.body_type && touchedFields.body_type &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.body_type.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Contact Number*</label>
              <input
                type="tel"
                {...register("contact_number")}
                value={watch('contact_number') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.contact_number ? 'border-red-500' : 'border-gray-400'} rounded`}
              />
              <ValidationIndicator field="contact_number" />
              {errors.contact_number && touchedFields.contact_number &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.contact_number.message}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium">Transmission Type*</label>
              <select
                {...register("transmission_type")}
                value={watch('transmission_type') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.transmission_type ? 'border-red-500' : 'border-gray-400'} rounded`}
              >
                <option value="">Select Transmission</option>
                {categorizedOptiions?.transmissions?.map((transmission) => (
                  <option key={transmission._id} value={transmission.name} data-name={transmission.name}>
                    {transmission.name}
                  </option>
                ))}
              </select>
              <ValidationIndicator field="transmission_type" />
              {errors.transmission_type && touchedFields.transmission_type &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.transmission_type.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Fuel Type*</label>
              <select
                {...register("fuel_type")}
                value={watch('fuel_type') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.fuel_type ? 'border-red-500' : 'border-gray-400'} rounded`}
              >
                <option value="">Select Fuel Type</option>
                {categorizedOptiions?.fuels?.map((fuel) => (
                  <option key={fuel._id} value={fuel.name} data-name={fuel.name}>
                    {fuel.name}
                  </option>
                ))}
              </select>
              <ValidationIndicator field="fuel_type" />
              {errors.fuel_type && touchedFields.fuel_type &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.fuel_type.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">Listing Type*</label>
              <select
                {...register("type")}
                value={watch('type') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.type ? 'border-red-500' : 'border-gray-400'} rounded`}
              >
                <option value="">Select listing type</option>
                {categorizedOptiions?.listingTypes?.map((listing) => (
                  <option key={listing._id} value={listing.name} data-name={listing.name}>
                    {listing.name}
                  </option>
                ))}
              </select>
              <ValidationIndicator field="type" />
              {errors.type && touchedFields.type &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.type.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">
                {isAuction ? 'Starting Bid' : 'Price'}*
              </label>
              <input
                type="number"
                {...register("starting_bid")}
                value={watch('starting_bid') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.starting_bid ? 'border-red-500' : 'border-gray-400'} rounded`}
                min="0"
              />
              <ValidationIndicator field="starting_bid" />
              {errors.starting_bid && touchedFields.starting_bid &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.starting_bid.message}
                </div>
              )}
            </div>
            {isAuction && (
              <div className="relative">
                <label className="block text-sm font-medium">Minimum Increment*</label>
                <input
                  type="number"
                  {...register("minimum_increment")}
                  value={watch('minimum_increment') || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.minimum_increment ? 'border-red-500' : 'border-gray-400'} rounded`}
                  min="0"
                />
                <ValidationIndicator field="minimum_increment" />
                {errors.minimum_increment && touchedFields.minimum_increment &&(
                  <div className="absolute -bottom-6 text-red-500 text-xs">
                    {errors.minimum_increment.message}
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <label className="block text-sm font-medium">Description*</label>
              <textarea
                {...register("description")}
                value={watch('description') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-400'} rounded h-40`}
              ></textarea>
              <ValidationIndicator field="description" />
              {errors.description && touchedFields.description &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.description.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Date Selection - Only show for Auction */}
        {isAuction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="relative">
              <label className="block text-sm font-medium">Start Date*</label>
              <input
                type="datetime-local"
                {...register("start_date")}
                value={watch('start_date') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.start_date ? 'border-red-500' : 'border-gray-400'} rounded`}
              />
              <ValidationIndicator field="start_date" />
              {errors.start_date && touchedFields.start_date &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.start_date.message}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium">End Date*</label>
              <input
                type="datetime-local"
                {...register("end_date")}
                value={watch('end_date') || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.end_date ? 'border-red-500' : 'border-gray-400'} rounded`}
              />
              <ValidationIndicator field="end_date" />
              {errors.end_date && touchedFields.end_date &&(
                <div className="absolute -bottom-6 text-red-500 text-xs">
                  {errors.end_date.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Upload Section */}
        <div className="mt-8">
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
          {errors.images && touchedFields.image &&(
            <div className="text-red-500 text-xs mt-2">
              {errors.images.message}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={handleDiscard}
            className="px-6 py-2 bg-gray-700 text-white rounded shadow-sm hover:bg-gray-600"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className={`px-6 py-2 ${isValid ? 'bg-black hover:bg-gray-900' : 'bg-gray-500 cursor-not-allowed'} text-white rounded shadow-sm`}
          >
            {isEditMode ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </form>
    </>
  );
};

export default AdminAddListingForm;