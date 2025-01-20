import { useState, useEffect } from "react";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { categoryService, listingService } from "../utils/api";
import { useNavigate, useSearchParams } from "react-router-dom";

const Accordion = ({ items, selectedFilters, onFilterChange }) => {
  const [openItem, setOpenItem] = useState(null);

  const toggleItem = (value) => {
    setOpenItem((prev) => (prev === value ? null : value));
  };

  return (
    <div className="w-full">
      {items.map((category) => (
        <div key={category._id} className="bg-gray-100 border-gray-300">
          <button
            onClick={() => toggleItem(category.name)}
            className="w-full flex justify-between items-center px-4 py-2 border-b"
          >
            {category.name}
            {openItem === category.name ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
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
  );
};

const CarCard = ({ listing }) => (
  <div className="bg-gray-100 rounded-lg overflow-hidden">
    <div className="relative h-48 bg-neutral-200">
      <img
        src={listing.images[0]?.url || '/placeholder-car.jpg'}
        alt={`${listing.make} ${listing.model}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button className="absolute top-2 right-2 p-1 rounded-full bg-white">
        <Heart size={20} />
      </button>
    </div>
    <div className="p-4">
      <h3 className="font-medium">{`${listing.year} ${listing.make} ${listing.model}`}</h3>
      <div className="text-sm text-neutral-600 mt-1">{listing.body_type}</div>
      <div className="text-lg font-bold mt-1">
        $ {listing.current_bid > 0 ? listing.current_bid.toLocaleString() : listing.starting_bid.toLocaleString()}
      </div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-neutral-600">{listing.type}</div>
        <div className="text-sm text-neutral-600">{listing.bid_count} Bids</div>
      </div>
      <div className="text-sm text-neutral-600 mt-1">
        Ends: {new Date(listing.end_date).toLocaleDateString()}
      </div>
    </div>
  </div>
);

const Listings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ searchParams, setSearchParams ] = useSearchParams();
  const navigate = useNavigate();

  useEffect(()=> {
    try {
      const urlFilters = searchParams.get('filters');
      if (urlFilters) {
        setSelectedFilters(JSON.parse(decodeURIComponent(urlFilters)));
      } else {
        // Initialize empty filters if none in URL
        const initialFilters = {};
        categories.forEach(category => {
          initialFilters[category.name] = [];
        });
        setSelectedFilters(initialFilters);
      }
    } catch (err) {
      console.error('Error parsing URL filters:', err);
    }
  },[searchParams, categories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, listingsResponse] = await Promise.all([
          categoryService.getAllCategories(),  
          listingService.getAllListings()      
        ]);

        const categoriesData = categoriesResponse.data;

        const activeCategories = categoriesData
          .filter(cat => !cat.isDeleted && Array.isArray(cat.subCategories) && cat.subCategories.length > 0)
          .map(cat => ({
            ...cat,
            subCategories: cat.subCategories.filter(sub => !sub.isDeleted)
          }));

        const activeListings = listingsResponse.filter(
          listing => 
            listing.approval_status === 'approved' && 
            !listing.is_deleted && 
            listing.status === 'active'
        );

        setCategories(activeCategories);
        setListings(activeListings);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateUrlWithFilters = (newFilters) => {
    // Remove empty filter arrays to keep the URL clean
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, values]) => values.length > 0)
    );

    if (Object.keys(cleanFilters).length > 0) {
      setSearchParams({ filters: encodeURIComponent(JSON.stringify(cleanFilters)) });
    } else {
      // If no filters, remove the filters parameter entirely
      setSearchParams({});
    }
  }

  const handleFilterChange = (category, value) => {
    const newFilters = {
      ...selectedFilters,
      [category]: selectedFilters[category]?.includes(value)
        ? selectedFilters[category].filter(v => v !== value)
        : [...(selectedFilters[category] || []), value]
    };

    setSelectedFilters(newFilters);
    updateUrlWithFilters(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {};
    categories.forEach(category => {
      emptyFilters[category.name] = [];
    });
    setSelectedFilters(emptyFilters);
    setSearchParams({});
  };

  const filterListings = (listings) => {
    return listings.filter(listing => {
      return Object.entries(selectedFilters).every(([category, values]) => {

        if (!values || values.length === 0) return true;
        
        // Map category names to listing fields
        const categoryFieldMap = {
          'Make': 'make',
          'Model': 'model',
          'Body Type': 'body_type',
          'Fuel Type': 'fuel_type',
          'Transmission': 'transmission_type',
          'Listing Type': 'type'
        };

        const field = categoryFieldMap[category];
        if (!field) return true;

        if (category === 'Year Range') {
          return values.some(range => {
            const [start, end] = range.split(' - ').map(Number);
            return listing.year >= start && listing.year <= end;
          });
        }

        // return values.includes(listing[field]);
        return values.some(value => 
          listing[field]?.toLowerCase() === value.toLowerCase()
        );
      });
    });
  };

  const filteredListings = filterListings(listings);

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  return (
    <>
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
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
              <Accordion 
                items={categories}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-neutral-200 text-center py-1 px-4 rounded-lg mb-6">
              {filteredListings.length} Active Listings
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map(listing => (
                    <div 
                      key={listing._id} 
                      onClick={() => navigate(`/listing/${listing._id}`)}
                      className="cursor-pointer"
                    >
                      <CarCard listing={listing} />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Listings;