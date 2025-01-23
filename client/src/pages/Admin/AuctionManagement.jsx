import { useNavigate } from 'react-router-dom';
import { Edit, Eye, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender
} from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { listingService } from '../../utils/api';

const AuctionManagement = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, [showDeleted]);

  const fetchListings = async () => {
    try {
      const response = await listingService.getAllListings();
      const filteredListings = showDeleted 
        ? response 
        : response.filter(listing => !listing.is_deleted);
      setListings(filteredListings);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch listings';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const getRemainingTime = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    if (now > end) return 'Auction ended';
    
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
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

  const handleApprovalChange = async (listingId, newStatus) => {
    try {
      await listingService.updateApprovalStatus(listingId, newStatus);
      console.log('handle:',listingId);
      setListings(listings.map(listing =>
        listing._id === listingId ? { ...listing, approval_status: newStatus } : listing
      ));
      toast.success('Approval status updated successfully');
    } catch (err) {
      console.error(err)
      toast.error('Failed to update approval status');
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      await listingService.updateListingStatus(listingId, newStatus);

      setListings(listings.map(listing => 
        listing._id === listingId ? { ...listing, status: newStatus } : listing
      ));
      toast.success('Status changed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to change status');
    }
  }

  const handleEdit = (listingId) => {
    navigate(`/admin/auctions/edit/${listingId}`);
  };

  const handleAddListing = () => {
    navigate('/admin/auctions/new-listing');
  };

  const formatSellerName = (seller) => {
    if (!seller) return 'Unknown';
    return `${seller.first_name} ${seller.last_name}`;
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'vehicle',
      header: 'Vehicle',
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex items-center space-x-3">
            <img 
              src={data.images[0]?.url || '/placeholder.png'} 
              alt={`${data.make} ${data.model}`}
              className="w-20 h-20 rounded-md object-cover"
            />
            <div className="font-medium">
              {`${data.year} ${data.make} ${data.model}`}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'seller',
      header: 'Seller',
      cell: ({ row }) => {
        const seller = row.original.seller_id;
        return formatSellerName(seller);
      }
    },
    {
      accessorKey: 'type',
      header: 'Type'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <select
          value={row.original.status}
          onChange={(e) => handleStatusChange(row.original._id, e.target.value)}
          className='bg-gray-100 border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-600 '
          onClick={(e) => e.stopPropagation()}
        >
          {['active', 'sold', 'pending start'].map(status => (
            <option key={status} value={status} className={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      )
    },
    {
      accessorKey: 'bids',
      header: 'Bids',
      cell: ({ row }) => (
        <div>
          <div>{row.original.bid_count} bids</div>
          <div className="text-xs text-gray-500">
            Min: {formatCurrency(row.original.minimum_increment)}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'price',
      header: 'Price Range',
      cell: ({ row }) => (
        <div>
          <div>{formatCurrency(row.original.current_bid || row.original.starting_bid)}</div>
          <div className="text-xs text-gray-500">
            Start: {formatCurrency(row.original.starting_bid)}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {getRemainingTime(row.original.end_date)}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(row.original.start_date)} to {formatDate(row.original.end_date)}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'approval',
      header: 'Approval',
      cell: ({ row }) => (
        <select
          value={row.original.approval_status}
          onChange={(e) => handleApprovalChange(row.original._id, e.target.value)}
          className="bg-gray-100 border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          {['pending', 'approved', 'rejected'].map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <button 
            className="p-2 text-blue-600 hover:text-blue-800"
            onClick={() => navigate(`/admin/auctions/listings/${row.original._id}`)}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button 
            className="p-2 text-blue-600 hover:text-blue-800"
            onClick={() => handleEdit(row.original._id)}
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ], [navigate]);

  const table = useReactTable({
    data: listings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });


  if (loading) {
    return (
      <div className="relative m-10">
        <div className="w-full h-48 flex items-center justify-center">
          <div className="text-gray-500">Loading listings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative m-10">
        <div className="w-full h-48 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative m-10">
    <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 pb-2">
      <h2 className="text-2xl font-bold text-gray-800">
        Auction Management
      </h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className="flex items-center gap-2 text-gray-600"
        >
          {showDeleted ? (
            <ToggleRight className="w-6 h-6" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
          Show Deleted
        </button>
        <button
          onClick={handleAddListing}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Add New Listing
        </button>
      </div>
    </div>

    <div className="rounded-md border border-gray-300">
      <table className="w-full table-auto">
        <thead className="bg-gray-300">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-b border-gray-300"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border-b bg-white hover:bg-gray-100">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 text-sm text-gray-600">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-4 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <span className="text-sm text-gray-600">
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </span>
    </div>
  </div>
);
};

export default AuctionManagement;