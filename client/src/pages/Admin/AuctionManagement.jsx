import { Edit, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../utils/api';

const AuctionManagement = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await listingService.getAllListings('/api/listings');
      setListings(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return amount ? `₹${(amount).toLocaleString('en-IN')}` : '0';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-500';
      case 'sold':
        return 'text-gray-500';
      case 'pending start':
        return 'text-yellow-500';
      default:
        return 'text-gray-700';
    }
  };

  const getApprovalStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-700';
    }
  };

  const handleRowClick = (listingId) => {
    window.location.href = `/listings/${listingId}`;
  };

  const handleAddListing = () => {
    navigate('/admin/auctions/new-listing');
  };

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-500">Loading listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!listings.length) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="text-gray-500">No listings found</div>
      </div>
    );
  }

  return (
    <div className="w-full p-9 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
      <h2 className="text-2xl font-bold text-gray-800 border-gray-300 pb-2">
        Auction Management
      </h2>
      <button
          onClick={handleAddListing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Listing
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Vehicle</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Bids</th>
              <th className="px-4 py-3 text-left">Price Range</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Approval</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <tr 
                key={listing._id}
                onClick={() => handleRowClick(listing._id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={listing.images[0]?.url || '/placeholder.png'} 
                      alt={`${listing.make} ${listing.model}`}
                      className="w-36 h-32 rounded-md object-cover"
                    />
                    <div>
                      <div className="font-medium">{`${listing.year} ${listing.make} ${listing.model}`}</div>
                      <div className="text-gray-500 text-xs">{listing.fuel_type} • {listing.transmission_type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{listing.type}</td>
                <td className={`px-4 py-3 ${getStatusColor(listing.status)}`}>
                  {listing.status}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{listing.bid_count} bids</div>
                  <div className="text-xs text-gray-500">
                    Min: {formatCurrency(listing.minimum_increment)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{formatCurrency(listing.current_bid || listing.starting_bid)}</div>
                  <div className="text-xs text-gray-500">Start: {formatCurrency(listing.starting_bid)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{formatDate(listing.start_date)}</div>
                  <div className="text-xs text-gray-500">to {formatDate(listing.end_date)}</div>
                </td>
                <td className={`px-4 py-3 ${getApprovalStatusColor(listing.approval_status)}`}>
                  {listing.approval_status}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="p-1 hover:bg-gray-100 rounded-full"
                      onClick={() => window.location.href = `/listings/${listing._id}`}
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-100 rounded-full"
                      onClick={() => console.log(`Edit ${listing._id}`)}
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button 
                      className="p-1 hover:bg-gray-100 rounded-full"
                      onClick={() => console.log(`Delete ${listing._id}`)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuctionManagement;