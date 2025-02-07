import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  PenToolIcon as Tool,
} from "lucide-react"
import { listingService } from "../../utils/api"
import BidHistory from "../../components/BidHistory"

const ListingDetail = () => {
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const navigate = useNavigate()
  const { listingId } = useParams()

  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setLoading(true)
        const response = await listingService.getListingById(listingId)

        if (!response || !response.data) {
          throw new Error("Listing details could not be retrieved")
        }

        setListing(response.data)
      } catch (err) {
        console.error("Error fetching listing details:", err)
        setError(err.message || "Failed to fetch listing details")
        toast.error("Failed to retrieve listing information")
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      fetchListingDetails()
    }
  }, [listingId])

  const handleStatusChange = async (status) => {
    try {
      await listingService.updateListingStatus(listingId, status)
      toast.success(`Listing ${status} successfully`)

      const updatedResponse = await listingService.getListingById(listingId)
      setListing(updatedResponse.data)
    } catch (err) {
      console.error(`Error ${status} listing:`, err)
      toast.error(`Failed to ${status} listing`)
    }
  }

  const handleDeleteListing = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")

    if (confirmDelete) {
      try {
        await listingService.deleteListing(listingId)
        toast.success("Listing deleted successfully")
        navigate("/admin/listings")
      } catch (err) {
        console.error("Error deleting listing:", err)
        toast.error("Failed to delete listing")
      }
    }
  }

  const renderStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return (
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={`${statusColors[status]} border-2 border-current py-1 px-3 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current transition-all duration-300`}
      >
        {["pending", "approved", "rejected"].map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
    )
  }

  const formatSellerName = (seller) => {
    if (!seller) return "Unknown"
    return `${seller.first_name} ${seller.last_name}`
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )

  if (error) return <div className="flex items-center justify-center h-screen text-red-500">Error: {error}</div>

  if (!listing) return <div className="flex items-center justify-center h-screen">No listing found</div>

  return (
    <div className="bg-gray-100 min-h-screen">
      <Toaster />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Navigation and Actions */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-blue-600 mr-4 transition-colors duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-bold text-gray-800">Listing Details</h2>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate(`/admin/auctions/edit/${listingId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center transform hover:scale-105"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit Listing
              </button>
              <button
                onClick={handleDeleteListing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center transform hover:scale-105"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="relative">
                {listing.images?.length > 0 ? (
                  <img
                    src={listing.images[currentImageIndex].url || "/placeholder.svg"}
                    alt={`${listing.make} ${listing.model}`}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-gray-500 bg-gray-200">
                    No Image Available
                  </div>
                )}
                {listing.images?.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length)
                      }
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-300"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % listing.images.length)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-300"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              {listing.images?.length > 1 && (
                <div className="flex p-4 space-x-2 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <img
                      key={image.public_id || index}
                      src={image.url || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 object-cover rounded-md cursor-pointer transition-all duration-300
                        ${index === currentImageIndex ? "ring-4 ring-blue-500" : "hover:ring-2 hover:ring-gray-300"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Vehicle Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Tag className="w-6 h-6 mr-2 text-blue-500" />
                    <span className="font-semibold">Body Type:</span>
                    <span className="ml-2">{listing.body_type || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-yellow-500" />
                    <span className="font-semibold">Fuel Type:</span>
                    <span className="ml-2">{listing.fuel_type || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Tool className="w-6 h-6 mr-2 text-gray-500" />
                    <span className="font-semibold">Transmission:</span>
                    <span className="ml-2">{listing.transmission_type || "N/A"}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-green-500" />
                    <span className="font-semibold">Engine Capacity:</span>
                    <span className="ml-2">{listing.cc_capacity ? `${listing.cc_capacity} cc` : "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-purple-500" />
                    <span className="font-semibold">Year:</span>
                    <span className="ml-2">{listing.year || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Full Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{listing.description || "No description provided"}</p>
            </div>

            {/* Bid History */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <BidHistory listingId={listingId} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Listing Status */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-semibold text-gray-800">Listing Status</h2>
                </div>
                {renderStatusBadge(listing.approval_status)}
              </div>
              {listing.approval_status === "pending" && (
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => handleStatusChange("approved")}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange("rejected")}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </button>
                </div>
              )}
            </div>

            {/* Pricing Information */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-6 h-6 mr-2 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-800">Pricing Information</h3>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-semibold">Listing Type:</span>
                  <span>{listing.type}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-semibold">Starting Price:</span>
                  <span>₹{listing.starting_bid?.toLocaleString() || "N/A"}</span>
                </p>
                {listing.type === "Auction" && (
                  <>
                    <p className="flex justify-between">
                      <span className="font-semibold">Current Bid:</span>
                      <span>₹{listing.current_bid?.toLocaleString() || "N/A"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">Number of Bids:</span>
                      <span>{listing.bid_count || 0}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">Minimum Increment:</span>
                      <span>₹{listing.minimum_increment?.toLocaleString() || "N/A"}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <User className="w-6 h-6 mr-2 text-blue-500" />
                <h3 className="text-xl font-semibold text-gray-800">Seller Details</h3>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-semibold">Name:</span>
                  <span>{formatSellerName(listing.seller_id) || "Not Available"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-semibold">Contact Number:</span>
                  <span>{listing.contact_number || "Not Available"}</span>
                </p>
              </div>
            </div>

            {/* Listing Dates */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Calendar className="w-6 h-6 mr-2 text-purple-500" />
                <h3 className="text-xl font-semibold text-gray-800">Listing Dates</h3>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-semibold">Created At:</span>
                  <span>{new Date(listing.createdAt).toLocaleString()}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-semibold">Last Updated:</span>
                  <span>{new Date(listing.updatedAt).toLocaleString()}</span>
                </p>
                {listing.type === "Auction" && (
                  <>
                    <p className="flex justify-between">
                      <span className="font-semibold">Start Date:</span>
                      <span>{new Date(listing.start_date).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold">End Date:</span>
                      <span>{new Date(listing.end_date).toLocaleString()}</span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Listing Metadata */}
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 mr-2 text-red-500" />
                <h3 className="text-xl font-semibold text-gray-800">Listing Metadata</h3>
              </div>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-semibold">Listing ID:</span>
                  <span>{listing._id}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-semibold">Is Deleted:</span>
                  <span>{listing.is_deleted ? "Yes" : "No"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="font-semibold">Approved By:</span>
                  <span>{listing.approved_by || "N/A"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail

