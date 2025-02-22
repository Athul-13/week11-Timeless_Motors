import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Heart, ChevronDown, ChevronUp, Search  } from "lucide-react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import { categoryService, listingService } from "../../utils/api"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
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
                <label key={subCategory._id} className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    className="rounded "
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

const SelectedFilters = ({ selectedFilters, onRemoveFilter, onClearAll }) => {
  const selectedCount = Object.values(selectedFilters)
    .flat()
    .length;

  if (selectedCount === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        {Object.entries(selectedFilters).map(([category, values]) =>
          values.map((value) => (
            <div
              key={`${category}-${value}`}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              <span className="mr-1">{`${category}: ${value}`}</span>
              <button
                onClick={() => onRemoveFilter(category, value)}
                className="ml-2 hover:text-blue-600"
              >
                ×
              </button>
            </div>
          ))
        )}
        {selectedCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

const Listings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [listings, setListings] = useState([])
  const [selectedFilters, setSelectedFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [showSold, setShowSold] = useState(false)
  const [sortOption, setSortOption] = useState("newest")

  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const observer = useRef()
  const ITEMS_PER_PAGE = 12

  const user = useSelector((state) => state.auth.user); 

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    try {
      const params = Object.fromEntries(searchParams.entries());
      
      // Handle filters
      if (params.filters) {
        setSelectedFilters(JSON.parse(decodeURIComponent(params.filters)));
      } else {
        const initialFilters = {};
        categories.forEach((category) => {
          initialFilters[category.name] = [];
        });
        setSelectedFilters(initialFilters);
      }

      // Handle sort option
      if (params.sort) {
        setSortOption(params.sort);
      }

      // Handle show sold
      if (params.showSold) {
        setShowSold(params.showSold === 'true');
      }

      // Handle search query
      if (params.search) {
        setSearchQuery(params.search);
      }
    } catch (err) {
      console.error("Error parsing URL parameters:", err);
    }
  }, [searchParams, categories]);

  const fetchData = async (pageNum = 1, isInitial = true) => {
    try {
      setLoadingMore(true)
      const [categoriesResponse, listingsResponse] = await Promise.all([
        isInitial ? categoryService.getAllCategories() : Promise.resolve({ data: categories }),
        listingService.getAllListings() // Keep using the existing API
      ])
  
      if (isInitial) {
        const categoriesData = categoriesResponse.data
        const activeCategories = categoriesData
          .filter((cat) => !cat.isDeleted && Array.isArray(cat.subCategories) && cat.subCategories.length > 0)
          .map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.filter((sub) => !sub.isDeleted),
          }))
        setCategories(activeCategories)
      }
  
      let activeListings = listingsResponse.filter(
        (listing) =>
          listing.approval_status === "approved" &&
          !listing.is_deleted &&
          (showSold ? listing.status === "active" || listing.status === "sold" : listing.status === "active")
      )
  
      // Implement client-side pagination since we can't modify the API
      const startIndex = (pageNum - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const paginatedListings = activeListings.slice(startIndex, endIndex)
  
      // Filter by search query if present
      if (searchQuery) {
        activeListings = activeListings.filter(listing => 
          `${listing.make} ${listing.model} ${listing.year}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      }
  
      setListings(prev => pageNum === 1 ? paginatedListings : [...prev, ...paginatedListings])
      setHasMore(endIndex < activeListings.length)
    } catch (err) {
      setError("Failed to fetch data")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
      setTimeout(() => {
        setLoadingMore(false);
      }, 2000)
    }
  }

  useEffect(() => {
    if (page > 1) {
      fetchData(page, false)
    }
  }, [page])

  useEffect(() => {
    setPage(1)
    fetchData(1, true)
  }, [showSold, searchQuery])

  // Infinite scroll implementation
  const lastListingElementRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);      
      }
    },{ threshold: 0.8, rootMargin: "100px" })
    
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])


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

    if (user) {
      fetchWishlistData();
    }
  }, [dispatch])

  const handleWishlistToggle = async (listingId) => {
    if(!user){
      toast.error('Login to add to wishlist');
      return;
    }

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

  const updateUrlParameters = (updates = {}) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const newParams = { ...currentParams, ...updates };

    // Clean up empty values
    Object.entries(newParams).forEach(([key, value]) => {
      if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        delete newParams[key];
      }
    });

    setSearchParams(newParams);
  };

  const handleFilterChange = (category, value) => {
    const newFilters = {
      ...selectedFilters,
      [category]: selectedFilters[category]?.includes(value)
        ? selectedFilters[category].filter((v) => v !== value)
        : [...(selectedFilters[category] || []), value],
    };

    setSelectedFilters(newFilters);
    updateUrlParameters({
      filters: encodeURIComponent(JSON.stringify(newFilters))
    });
  };

  const handleRemoveFilter = (category, value) => {
    const newFilters = {
      ...selectedFilters,
      [category]: selectedFilters[category].filter((v) => v !== value),
    };

    setSelectedFilters(newFilters);
    updateUrlParameters({
      filters: encodeURIComponent(JSON.stringify(newFilters))
    });
  };

  const clearFilters = () => {
    const emptyFilters = {};
    categories.forEach((category) => {
      emptyFilters[category.name] = [];
    });
    setSelectedFilters(emptyFilters);
    updateUrlParameters({ filters: undefined });
  };

  const filterListings = (listings) => {
    return listings.filter((listing) => {
      // Search filter
      const searchMatches = searchQuery === "" || 
        `${listing.make} ${listing.model} ${listing.year}`.toLowerCase()
          .includes(searchQuery.toLowerCase())

      // Category filters
      const categoryMatches = Object.entries(selectedFilters).every(([category, values]) => {
        if (!values || values.length === 0) return true

        const categoryFieldMap = {
          Make: "make",
          Model: "model",
          "Body Type": "body_type",
          "Fuel Type": "fuel_type",
          Transmission: "transmission_type",
          "Listing Type": "type",
          "Year": "year",
          "Price": "price"
        }

        const field = categoryFieldMap[category]
        if (!field) return true

        if (category === "Year") {
          return values.some((range) => {
              const [start, end] = range.split(" - ").map(part => part.replace(/\D/g, '')); // Extract numbers
              const yearStart = start ? Number(start) : null;
              const yearEnd = end ? Number(end) : null;

              if (yearStart && yearEnd) return listing.year >= yearStart && listing.year <= yearEnd;
              if (yearStart) return listing.year >= yearStart;
              if (yearEnd) return listing.year <= yearEnd;
              
              return false;
          });
        }

        if (category === "Price") {
          return values.some((range) => {
            const listingPrice = listing.type === "Fixed price" 
            ? listing.starting_bid 
            : (listing.current_bid > 0 ? listing.current_bid : listing.starting_bid)

            // Predefined ranges
            switch (range) {
              case 'Under ₹90,000':
                return listingPrice < 90000
              case '₹90,000 - ₹10,00,000':
                return listingPrice >= 90000 && listingPrice < 1000000
              case '₹10,00,000 - ₹20,00,000':
                return listingPrice >= 1000000 && listingPrice < 2000000
              case 'Above ₹20,00,000':
                return listingPrice >= 2000000
              default:
                return false
            }
          })
        }

        return values.some((value) => listing[field]?.toLowerCase() === value.toLowerCase())
      })

      return searchMatches && categoryMatches
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
      <div className="w-full bg-gray-100 shadow border-gray-300 p-3 rounded-md mt-2">
      <label className="flex items-center cursor-pointer justify-between">
        <span className="text-sm font-medium text-gray-700">{showSold ? "Hide Sold Items" : "Show Sold Items"}</span>
        <div
          className={`w-12 h-6 flex items-center bg-gray-300 border border-gray-400 rounded-full p-1 transition duration-300 ${
            showSold ? "bg-gray-600 border-x-gray-600" : ""
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
    </div>
    )
  }

  const handleSortChange = (newSortOption) => {
    setSortOption(newSortOption);
    updateUrlParameters({ sort: newSortOption });
  };

  const handleShowSoldToggle = () => {
    const newShowSold = !showSold;
    setShowSold(newShowSold);
    updateUrlParameters({ showSold: newShowSold.toString() });
  };

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
    setListings([]);
    updateUrlParameters({ search: value });
    fetchData(1, false);
  }, []);

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
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search by make, model, or year..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

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
            <ToggleSwitch showSold={showSold} setShowSold={handleShowSoldToggle} />
          </div>

          <div className="flex-1">
            <SelectedFilters
              selectedFilters={selectedFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={clearFilters}
            />

            <div className="flex justify-between items-center mb-4">
              <div className="bg-neutral-200 text-center py-1 px-4 rounded-lg">
                {filteredAndSortedListings.length} Active Listings
              </div>
              <SortDropdown sortOption={sortOption} setSortOption={handleSortChange} />
            </div>
            {/* <div className="bg-neutral-200 text-center py-1 px-4 rounded-lg mb-6">
              {filteredListings.length} Active Listings
            </div> */}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedListings.map((listing, index) => (
                  <div
                    key={listing._id}
                    ref={index === filteredAndSortedListings.length - 1 ? lastListingElementRef : null}
                  >
                    <CarCard
                      listing={listing}
                      isInWishlist={wishlist.some((item) => item.product._id === listing._id)}
                      onWishlistToggle={handleWishlistToggle}
                      onClick={() => navigate(`/listing/${listing._id}`)}
                    />
                  </div>
                ))}
              </div>
            )}
            {loadingMore && <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Listings

