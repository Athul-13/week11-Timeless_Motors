import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  Shield, 
  Tag, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { listingService } from '../../utils/api';

const ListingDetail = () => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const navigate = useNavigate();
  const { listingId } = useParams();

  // Fetch listing details with comprehensive admin-level information
  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true);
        const response = await listingService.getListingById(listingId);
        console.log('res', response.data);
        
        if (!response || !response.data) {
          throw new Error('Listing details could not be retrieved');
        }

        setListing(response.data);
      } catch (err) {
        console.error('Error fetching listing details:', err);
        setError(err.message || 'Failed to fetch listing details');
        toast.error('Failed to retrieve listing information');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId]);

  // Handle listing status change (approve/reject)
  const handleStatusChange = async (status) => {
    try {
      await listingService.updateListingStatus(listingId, status);
      toast.success(`Listing ${status} successfully`);
      
      // Refresh listing details after status change
      const updatedResponse = await listingService.getListingById(listingId);
      setListing(updatedResponse.data);
    } catch (err) {
      console.error(`Error ${status} listing:`, err);
      toast.error(`Failed to ${status} listing`);
    }
  };

  // Handle listing deletion
  const handleDeleteListing = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this listing? This action cannot be undone.');
    
    if (confirmDelete) {
      try {
        await listingService.deleteListing(listingId);
        toast.success('Listing deleted successfully');
        navigate('/admin/listings');
      } catch (err) {
        console.error('Error deleting listing:', err);
        toast.error('Failed to delete listing');
      }
    }
  };

  const renderStatusBadge = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };

    return (
      <select 
        value={status} 
        className="bg-gray-100 border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-600"
      >
        {['pending', 'approved', 'rejected'].map(s => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    );
  };

  const formatSellerName = (seller) => {
    if (!seller) return 'Unknown';
    return `${seller.first_name} ${seller.last_name}`;
  };

  if (loading) return <div className="relative m-10 text-gray-500">Loading listing details...</div>;
  if (error) return <div className="relative m-10 text-red-500">Error: {error}</div>;
  if (!listing) return <div className="relative m-10">No listing found</div>;

  return (
    <div className="relative m-10">
      <Toaster />

      {/* Header with Navigation and Actions */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            Listing Details
          </h2>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigate(`/admin/auctions/edit/${listingId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2 inline" /> Edit Listing
          </button>
          <button 
            onClick={handleDeleteListing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2 inline" /> Delete
          </button>
        </div>
      </div>

      {/* Listing Status Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-800">Listing Status</h2>
          </div>
          {renderStatusBadge(listing.approval_status)}
        </div>

        {listing.approval_status === 'pending' && (
          <div className="flex space-x-4">
            <button 
              onClick={() => handleStatusChange('approved')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Approve Listing
            </button>
            <button 
              onClick={() => handleStatusChange('rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <XCircle className="w-4 h-4 mr-2" /> Reject Listing
            </button>
          </div>
        )}
      </div>

      {/* Basic Listing Information */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          <div className="mb-4">
            {listing.images?.length > 0 ? (
              <img 
                src={listing.images[currentImageIndex].url} 
                alt={`${listing.make} ${listing.model}`} 
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-500 border border-gray-300 rounded-lg">
                No Image Available
              </div>
            )}
          </div>

          {listing.images?.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {listing.images.map((image, index) => (
                <img 
                  key={image.public_id || index}
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-20 h-20 object-cover rounded cursor-pointer 
                    ${index === currentImageIndex ? 'ring-2 ring-gray-600' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detailed Information */}
        <div>
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            {listing.year} {listing.make} {listing.model}
          </h1>

          {/* Seller Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <User className="w-5 h-5 mr-2 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Seller Details</h3>
            </div>
            <p><strong className="text-gray-600">Name:</strong> {formatSellerName(listing.seller_id) || 'Not Available'}</p>
            <p><strong className="text-gray-600">Contact Number:</strong> {listing.contact_number || 'Not Available'}</p>
          </div>

          {/* Pricing & Auction Details */}
          <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <DollarSign className="w-5 h-5 mr-2 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Pricing Information</h3>
            </div>
            <p><strong className="text-gray-600">Listing Type:</strong> {listing.type}</p>
            <p><strong className="text-gray-600">Starting Price:</strong> ₹{listing.starting_bid?.toLocaleString() || 'N/A'}</p>
            {listing.type === 'Auction' && (
              <>
                <p><strong className="text-gray-600">Current Bid:</strong> ₹{listing.current_bid?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-gray-600">Number of Bids:</strong> {listing.bid_count || 0}</p>
                <p><strong className="text-gray-600">Minimum Increment:</strong> ₹{listing.minimum_increment?.toLocaleString() || 'N/A'}</p>
              </>
            )}
          </div>

          {/* Listing Dates */}
          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 mr-2 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Listing Dates</h3>
            </div>
            <p><strong className="text-gray-600">Created At:</strong> {new Date(listing.createdAt).toLocaleString()}</p>
            <p><strong className="text-gray-600">Last Updated:</strong> {new Date(listing.updatedAt).toLocaleString()}</p>
            {listing.type === 'Auction' && (
              <>
                <p><strong className="text-gray-600">Start Date:</strong> {new Date(listing.start_date).toLocaleString()}</p>
                <p><strong className="text-gray-600">End Date:</strong> {new Date(listing.end_date).toLocaleString()}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-8 bg-white border border-gray-300 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Full Vehicle Details</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <Tag className="w-5 h-5 mb-2 text-gray-500" />
            <h3 className="font-semibold mb-2 text-gray-800">Vehicle Information</h3>
            <p><strong className="text-gray-600">Body Type:</strong> {listing.body_type || 'N/A'}</p>
            <p><strong className="text-gray-600">Fuel Type:</strong> {listing.fuel_type || 'N/A'}</p>
            <p><strong className="text-gray-600">Transmission:</strong> {listing.transmission_type || 'N/A'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <Clock className="w-5 h-5 mb-2 text-gray-500" />
            <h3 className="font-semibold mb-2 text-gray-800">Technical Specifications</h3>
            <p><strong className="text-gray-600">Engine Capacity:</strong> {listing.cc_capacity ? `${listing.cc_capacity} cc` : 'N/A'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <Shield className="w-5 h-5 mb-2 text-gray-500" />
            <h3 className="font-semibold mb-2 text-gray-800">Listing Metadata</h3>
            <p><strong className="text-gray-600">Listing ID:</strong> {listing._id}</p>
            <p><strong className="text-gray-600">Is Deleted:</strong> {listing.is_deleted ? 'Yes' : 'No'}</p>
            <p><strong className="text-gray-600">Approved By:</strong> {listing.approved_by || 'N/A'}</p>
          </div>
        </div>

        {/* Full Description */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-300">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Full Description</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {listing.description || 'No description provided'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;