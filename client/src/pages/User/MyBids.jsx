import { useState, useEffect } from "react"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"
import { listingService } from "../../utils/api"

const ListingBidCard = ({ listing, bids }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

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

  const highestUserBid = Math.max(...bids.map(bid => bid.bid_amount))
  const isWinning = listing.current_bid === highestUserBid

  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div
        className="p-6 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-medium text-gray-900">
              {listing.make} {listing.model}
            </h2>
            <p className="text-gray-600 mt-1">Year: {listing.year}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium text-gray-900">
              Current Highest: ₹{listing.current_bid?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Your Bids: {bids.length}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusStyles(listing.status)}`}>
              {listing.status}
            </span>
            {isWinning && (
              <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Highest Bidder
              </span>
            )}
          </div>
          <button className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200">
            <span className="mr-2">{isExpanded ? "Hide Bids" : "Show Bids"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 border-t border-gray-200 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Your Bid History</h3>
              <div className="space-y-3">
                {bids.sort((a, b) => new Date(b.bid_date) - new Date(a.bid_date)).map((bid) => (
                  <div 
                    key={bid.bid_id}
                    className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{bid.bid_amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Placed on {formatDate(bid.bid_date)}
                      </p>
                    </div>
                    {listing.current_bid === bid.bid_amount && (
                      <span className="text-xs font-medium text-green-600">
                        Current Highest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {listing.images && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Vehicle Image</h3>
                <img
                  src={listing.images}
                  alt={`${listing.make} ${listing.model}`}
                  className="w-52 h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const MyBids = () => {
  const [listingsWithBids, setListingsWithBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchBids = async () => {
      try {
        const data = await listingService.getBidsByUser()
        
        if (mounted && data.success) {
          // Group bids by listing
          const groupedBids = data.data.reduce((acc, bid) => {
            const listingId = bid.listing.id
            if (!acc[listingId]) {
              acc[listingId] = {
                listing: bid.listing,
                bids: []
              }
            }
            acc[listingId].bids.push(bid)
            return acc
          }, {})

          setListingsWithBids(Object.values(groupedBids))
        } else if (mounted) {
          setError(data.message)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to fetch bids")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchBids()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading bids</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (listingsWithBids.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No bids found</p>
          <p className="text-sm text-gray-500 mt-2">When you place bids on vehicles, they will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Your Bids</h1>
        <div className="space-y-4">
          {listingsWithBids.map(({ listing, bids }) => (
            <ListingBidCard key={listing.id} listing={listing} bids={bids} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MyBids