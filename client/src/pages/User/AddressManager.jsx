import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, MoreVertical, Edit2, Trash2, Check } from 'lucide-react';
import { fetchAddresses, addAddress, editAddress, removeAddress } from '../../redux/addressSlice';

const AddressManager = ({ 
  selectionEnabled = false, 
  onSelect = () => {}, 
  selectedAddressId = null,
  className = "" 
}) => {
  const dispatch = useDispatch();
  const { addresses, status, error } = useSelector((state) => state.address);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    pincode: '',
    landmark: '',
    address: '',
    city: '',
    state: 'Kerala',
    country: 'India'
  });

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(null);
  };

  const formatAddressData = (data) => {
    return {
      name: data.name,
      phone_number: data.phone_number,
      address: data.address,
      landmark: data.landmark,
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      country: data.country
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      const formattedData = formatAddressData(formData);
      
      if (editingAddress) {
        await dispatch(editAddress({ 
          addressId: editingAddress._id, 
          addressData: formattedData 
        })).unwrap();
      } else {
        await dispatch(addAddress(formattedData)).unwrap();
      }
      
      dispatch(fetchAddresses());
      setShowForm(false);
      setEditingAddress(null);
      resetForm();
    } catch (err) {
      setFormError(err.message || 'Failed to save address. Please try again.');
      console.error('Error saving address:', err);
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone_number: address.phone_number,
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      address: address.address,
      city: address.city,
      state: address.state || 'Kerala',
      country: address.country
    });
    setShowForm(true);
    setShowDropdown(null);
  };

  const handleDelete = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await dispatch(removeAddress(addressId)).unwrap();
        setShowDropdown(null);
      } catch (err) {
        console.error('Error deleting address:', err);
        alert('Failed to delete address. Please try again.');
      }
    }
  };

  const handleAddressSelect = (address) => {
    onSelect(address);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone_number: '',
      pincode: '',
      landmark: '',
      address: '',
      city: '',
      state: 'Kerala',
      country: 'India'
    });
    setFormError(null);
  };

  if (status === 'loading' && !addresses?.length) {
    return (
      <div className={`max-w-3xl mx-auto mt-5 p-4 bg-gray-200 ${className}`}>
        <div className="text-center py-4">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto mt-5 p-4 rounded-xl bg-gray-200 ${className}`}>
      <div className="px-4 py-3">
        <h2 className="text-lg font-medium mb-4">
          {selectionEnabled ? 'Select Address' : 'Manage Addresses'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error.message || 'An error occurred'}
          </div>
        )}
        
        {!showForm && !editingAddress && (
          <div className="bg-white mb-4">
            <button 
              className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-50 flex items-center transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-5 h-5 mr-2" strokeWidth={3} />
              <span className="font-medium">ADD A NEW ADDRESS</span>
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-gray-100 mb-4 p-4">
            <h2 className="text-md text-gray-800 font-medium mb-4">
              {editingAddress ? 'EDIT ADDRESS' : 'ADD A NEW ADDRESS'}
            </h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="10-digit mobile number"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="pincode"
                  placeholder="Pincode"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
                <input
                  type="text"
                  name="landmark"
                  placeholder="Landmark"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.landmark}
                  onChange={handleInputChange}
                />
              </div>
              
              <textarea
                name="address"
                placeholder="Address (Area and Street)"
                className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none h-24"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="city"
                  placeholder="City/District/Town"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
                <select
                  name="state"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Kerala">Kerala</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="country"
                  className="w-full p-3 bg-white border border-transparent focus:border-neutral-400 outline-none"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="India">India</option>
                  <option value="Dubai">Dubai</option>
                </select>
              </div>

              <div className="flex justify-between pt-4 border-t border-neutral-300">
                <button 
                  type="button"
                  className="px-4 py-2 text-sm hover:bg-neutral-300 transition-colors"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-white text-sm bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  {editingAddress ? 'Save changes' : 'Add address'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {status === 'loading' ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            addresses
            .filter((addr) => addr._id !== editingAddress?._id)
            .map((addr) => (
              <div 
                key={addr._id} 
                className={`bg-white px-4 py-3 relative ${
                  selectionEnabled ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${
                  selectionEnabled && selectedAddressId === addr._id ? 'border-2 border-blue-500' : ''
                }`}
                onClick={() => selectionEnabled && handleAddressSelect(addr)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium">{addr.name}</span>
                      <span className="text-gray-700">{addr.phone_number}</span>
                      {addr.type && (
                        <span className="bg-neutral-100 px-2 py-0.5 text-sm">
                          {addr.type}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {addr.address},
                      <br />
                      {addr.location} - {addr.pincode}
                      <br />
                      {addr.country}
                    </p>
                  </div>
                  {selectionEnabled && selectedAddressId === addr._id && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                  {!selectionEnabled && (
                    <div className="relative">
                      <button
                        className="p-1 hover:bg-gray-100 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown(showDropdown === addr._id ? null : addr._id);
                        }}
                        onMouseEnter={() => setShowDropdown(addr._id)}
                        onMouseLeave={() => setShowDropdown(null)}
                      >
                        <MoreVertical className="w-5 h-5 text-neutral-400" />
                      </button>
                      {showDropdown === addr._id && (
                        <div 
                          className="absolute right-0 top-8 w-32 bg-white shadow-lg rounded-md py-1 z-10"
                          onMouseEnter={() => setShowDropdown(addr._id)}
                          onMouseLeave={() => setShowDropdown(null)}
                        >
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(addr);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(addr._id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressManager;