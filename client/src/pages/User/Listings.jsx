import { useState, useEffect, useMemo } from "react"
import { Heart, ChevronDown, ChevronUp } from "lucide-react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import { categoryService, listingService } from "../../utils/api"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch } from "react-redux"
import { fetchWishlist, addToWishlistAsync, removeFromWishlistAsync } from "../../redux/wishlistSlice"
import { toast, Toaster } from "react-hot-toast"

const Accordion = ({ items, selectedFilters, onFilterChange }) => {
  const [openItem, setOpenItem] = useState(null)

  const toggleItem = (value) => {
    setOpenItem((prev) => (prev === value ? null : value))
  }

  return (
    <div className="w-full">
      {items.map((category) => (
        <div key={category._id} className="bg-gray-100 border-gray-300">
          <button
            onClick={() => toggleItem(category.name)}
            className="w-full flex justify-between items-center px-4 py-2 border-b"
          >
            {category.name}
            {openItem === category.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {openItem === category.name && (
            <div className="px-4 py-2 mx-2 bg-white">
              {category.subCategories.map((subCategory) => (
                <label key={subCategory._id} className="flex items-center space-y-2 mb-2">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedFilters[category.name]?.includes(subCategory.name) || false}
                    onChange={() => onFilterChange(category.name, subCategory.name)}
                  />
                  <span className="text-sm ml-2">{subCategory.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const CarCard = ({ listing, isInWishlist, onWishlistToggle, onClick }) => {
  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="cursor-pointer" onClick={() => onClick(listing._id)}>
        <div className="relative h-48 bg-neutral-200">
          <img
            src={listing.images[0]?.url || "/placeholder-car.jpg"}
            alt={`${listing.make} ${listing.model}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        </div>
        <div className="p-4">
          <h3 className="font-medium">{`${listing.year} ${listing.make} ${listing.model}`}</h3>
          <div className="text-sm text-neutral-600 mt-1">{listing.body_type}</div>
          <div className="text-lg font-bold mt-1">
            ₹ {listing.current_bid > 0 ? listing.current_bid.toLocaleString() : listing.starting_bid.toLocaleString()}
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-neutral-600">{listing.type}</div>
            <div className="text-sm text-neutral-600">{listing.bid_count} Bids</div>
          </div>
          <div className="text-sm text-neutral-600 mt-1">Ends: {listing.type === "Fixed price" ? "Not Applicable" : new Date(listing.end_date).toLocaleDateString()}</div>
        </div>
      </div>

      <button
        className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-gray-100 z-10"
        onClick={(e) => {
          e.stopPropagation()
          onWishlistToggle(listing._id)
        }}
      >
        <Heart size={20} color={isInWishlist ? "red" : "black"} fill={isInWishlist ? "red" : "none"} />
      </button>
    </div>
  )
}

const Listings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [showSold, setShowSold] = useState(false)
  const [sortOption, setSortOption] = useState("newest") // Added state for sorting

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    try {
      const urlFilters = searchParams.get("filters")
      if (urlFilters) {
        setSelectedFilters(JSON.parse(decodeURIComponent(urlFilters)))
      } else {
        const initialFilters = {}
        categories.forEach((category) => {
          initialFilters[category.name] = []
        })
        setSelectedFilters(initialFilters)
      }
    } catch (err) {
      console.error("Error parsing URL filters:", err)
    }
  }, [searchParams, categories])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, listingsResponse] = await Promise.all([
          categoryService.getAllCategories(),
          listingService.getAllListings(),
        ])

        const categoriesData = categoriesResponse.data

        const activeCategories = categoriesData
          .filter((cat) => !cat.isDeleted && Array.isArray(cat.subCategories) && cat.subCategories.length > 0)
          .map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.filter((sub) => !sub.isDeleted),
          }))

        const activeListings = listingsResponse.filter(
          (listing) =>
            listing.approval_status === "approved" &&
            !listing.is_deleted &&
            (showSold ? listing.status === "active" || listing.status === "sold" : listing.status === "active"),
        )

        setCategories(activeCategories)
        setListings(activeListings)
      } catch (err) {
        setError("Failed to fetch data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showSold])

  useEffect(() => {
    const fetchWishlistData = async () => {
      try {
        const resultAction = await dispatch(fetchWishlist())

        if (fetchWishlist.fulfilled.match(resultAction)) {
          const wishlistResponse = resultAction.payload

          if (Array.isArray(wishlistResponse) && wishlistResponse.length > 0) {
            const items = wishlistResponse[0].items
            setWishlist(items)
          } else {
            console.error("Wishlist response is empty or not an array:", wishlistResponse)
          }
        } else {
          console.error("Error fetching wishlist:", resultAction.payload || "Something went wrong")
        }
      } catch (err) {
        console.error("Error fetching wishlist status:", err)
      }
    }

    fetchWishlistData()
  }, [dispatch])

  const handleWishlistToggle = async (listingId) => {
    try {
      const isInWishlist = wishlist.some((item) => item.product._id === listingId)

      if (isInWishlist) {
        await dispatch(removeFromWishlistAsync(listingId))
        toast.success("Removed from wishlist")
      } else {
        await dispatch(addToWishlistAsync(listingId))
        toast.success("Added to wishlist")
      }

      const resultAction = await dispatch(fetchWishlist())
      if (fetchWishlist.fulfilled.match(resultAction)) {
        const updatedWishlist = resultAction.payload[0].items
        setWishlist(updatedWishlist)
      }
    } catch (err) {
      console.error("Error updating wishlist:", err)
      toast.error("Failed to update wishlist")
    }
  }

  const updateUrlWithFilters = (newFilters) => {
    const cleanFilters = Object.fromEntries(Object.entries(newFilters).filter(([_, values]) => values.length > 0))

    if (Object.keys(cleanFilters).length > 0) {
      setSearchParams({ filters: encodeURIComponent(JSON.stringify(cleanFilters)) })
    } else {
      setSearchParams({})
    }
  }

  const handleFilterChange = (category, value) => {
    const newFilters = {
      ...selectedFilters,
      [category]: selectedFilters[category]?.includes(value)
        ? selectedFilters[category].filter((v) => v !== value)
        : [...(selectedFilters[category] || []), value],
    }

    setSelectedFilters(newFilters)
    updateUrlWithFilters(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = {}
    categories.forEach((category) => {
      emptyFilters[category.name] = []
    })
    setSelectedFilters(emptyFilters)
    setSearchParams({})
  }

  const filterListings = (listings) => {
    return listings.filter((listing) => {
      return Object.entries(selectedFilters).every(([category, values]) => {
        if (!values || values.length === 0) return true

        const categoryFieldMap = {
          Make: "make",
          Model: "model",
          "Body Type": "body_type",
          "Fuel Type": "fuel_type",
          Transmission: "transmission_type",
          "Listing Type": "type",
        }

        const field = categoryFieldMap[category]
        if (!field) return true

        if (category === "Year Range") {
          return values.some((range) => {
            const [start, end] = range.split(" - ").map(Number)
            return listing.year >= start && listing.year <= end
          })
        }

        return values.some((value) => listing[field]?.toLowerCase() === value.toLowerCase())
      })
    })
  }

  const sortListings = (listings) => {
    return [...listings].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt)
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt)
        case "lowest":
          return a.starting_bid - b.starting_bid
        case "highest":
          return b.starting_bid - a.starting_bid
        case "makeAZ":
          return a.make.localeCompare(b.make)
        case "makeZA":
          return b.make.localeCompare(a.make)
        default:
          return 0
      }
    })
  }

  const filteredAndSortedListings = useMemo(() => {
    return sortListings(filterListings(listings))
  }, [listings, selectedFilters, sortOption])

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>
  }

  const ToggleSwitch = ({ showSold, setShowSold }) => {
    return (
      <label className="flex items-center cursor-pointer">
        <span className="mr-2 text-sm">{showSold ? "Hide Sold Items" : "Show Sold Items"}</span>
        <div
          className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 transition duration-300 ${
            showSold ? "bg-green-500" : ""
          }`}
          onClick={() => setShowSold((prev) => !prev)}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
              showSold ? "translate-x-6" : ""
            }`}
          ></div>
        </div>
      </label>
    )
  }

  const SortDropdown = ({ sortOption, setSortOption }) => {
    return (
      <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="p-2 border rounded-md">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="lowest">Lowest Price</option>
        <option value="highest">Highest Price</option>
        <option value="makeAZ">Make (A-Z)</option>
        <option value="makeZA">Make (Z-A)</option>
      </select>
    )
  }

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div className="min-h-screen p-4 md:p-6">
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="px-4 py-2 border rounded-lg flex items-center gap-2"
          >
            Filters {isSidebarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className={`md:w-64 flex-shrink-0 ${isSidebarOpen ? "block" : "hidden"} md:block`}>
            <div className="bg-white shadow rounded-lg">
              <div className="flex justify-between items-center p-4">
                <span className="text-sm font-medium">Filter By</span>
                <button className="text-sm text-blue-600 hover:text-blue-800" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
              <Accordion items={categories} selectedFilters={selectedFilters} onFilterChange={handleFilterChange} />
            </div>
            <ToggleSwitch showSold={showSold} setShowSold={setShowSold} />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-neutral-200 text-center py-1 px-4 rounded-lg">
                {filteredAndSortedListings.length} Active Listings
              </div>
              <SortDropdown sortOption={sortOption} setSortOption={setSortOption} />
            </div>
            {/* <div className="bg-neutral-200 text-center py-1 px-4 rounded-lg mb-6">
              {filteredListings.length} Active Listings
            </div> */}

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedListings.map((listing) => (
                  <CarCard
                    key={listing._id}
                    listing={listing}
                    isInWishlist={wishlist.some((item) => item.product._id === listing._id)}
                    onWishlistToggle={handleWishlistToggle}
                    onClick={() => navigate(`/listing/${listing._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Listings

