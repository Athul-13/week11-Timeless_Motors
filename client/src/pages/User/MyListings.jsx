import { useState, useEffect } from "react"
import { FileText, Edit } from "lucide-react"
import { listingService } from "../../utils/api"
import { useNavigate } from "react-router-dom"

const ListingCard = ({ listing }) => {
  const navigate = useNavigate()

  const getStatusStyles = (status) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "sold":
        return "bg-green-100 text-green-800"
      case "pending start":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getApprovalStatusStyles = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              {listing.make} {listing.model}
            </h2>
            <p className="text-gray-600 mt-1">Year: {listing.year}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">
              {listing.type === "Auction" ? (
                `Starting Bid: ₹${listing.starting_bid?.toLocaleString()}`
              ) : (
                `Price: ₹${listing.starting_bid?.toLocaleString()}`
              )}
            </p>
            {listing.type === "Auction" && listing.current_bid > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Current Bid: ₹{listing.current_bid?.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <p className="text-sm text-gray-600">Fuel: {listing.fuel_type}</p>
            <p className="text-sm text-gray-600">Transmission: {listing.transmission_type}</p>
            <p className="text-sm text-gray-600">Body Type: {listing.body_type}</p>
            <p className="text-sm text-gray-600">Engine: {listing.cc_capacity}cc</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusStyles(listing.status)}`}>
              {listing.status}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getApprovalStatusStyles(listing.approval_status)}`}>
              {listing.approval_status}
            </span>
            <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
              {listing.type}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            {listing.images?.length > 0 && (
            <div className="flex gap-2">
                {listing.images.map((image, index) => (
                <img
                    key={index}
                    src={image.url} // Ensure you access the `url` property
                    alt={`${listing.make} ${listing.model} - ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                />
                ))}
            </div>
            )}
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600">Bids: {listing.bid_count || 0}</p>
                {listing.type === "Auction" && (
                  <>
                    <p className="text-sm text-gray-600">
                      Starts: {new Date(listing.start_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Ends: {new Date(listing.end_date).toLocaleDateString()}
                    </p>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={() => navigate(`/profile/mylistings/edit/${listing._id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MyListings = () => {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchListings = async () => {
      try {
        const data = await listingService.getListingsByUser()
        
        if (mounted && data.success) {
          setListings(data.data)
        } else if (mounted) {
          setError(data.message)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to fetch listings")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchListings()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading listings</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No listings found</p>
          <p className="text-sm text-gray-500 mt-2">When you create listings, they will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Your Listings</h1>
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyListings