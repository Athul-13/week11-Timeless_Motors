import { useState, useEffect } from "react"
import { FileText, ChevronDown, ChevronUp, ChevronRight, ChevronLeft } from "lucide-react"
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    let mounted = true

    const fetchBids = async () => {
      try {
        const data = await listingService.getBidsByUser(currentPage, itemsPerPage)
        
        if (mounted && data.success) {
          // Group bids by listing
          const groupedBids = data.data.formattedBids.reduce((acc, bid) => {
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

          if (data.data.totalPages) {
            setTotalPages(data.data.totalPages)
          } else if (data.data.totalCount) {
            // Calculate total pages if API returns only total count
            setTotalPages(Math.ceil(data.data.totalCount / itemsPerPage))
          }
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
  }, [currentPage, itemsPerPage])

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value, 10)
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
  }

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

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first and last page
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-gray-200 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-6">Your Bids</h1>
        <div className="flex items-center space-x-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="p-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
      </div>
        <div className="space-y-4">
          {listingsWithBids.map(({ listing, bids }) => (
            <ListingBidCard key={listing.id} listing={listing} bids={bids} />
          ))}
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
              {/* Previous page button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md flex items-center justify-center ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {/* Page numbers */}
              {getPageNumbers().map((pageNum, index) => (
                pageNum === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-current={currentPage === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                )
              ))}
              
              {/* Next page button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md flex items-center justify-center ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBids