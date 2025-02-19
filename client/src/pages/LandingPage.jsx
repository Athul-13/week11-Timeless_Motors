import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import homeBanner from '../assets/home-banner.jpg';
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { listingService } from "../utils/api";
import RecordPriceCarousel from "../components/RecordPriceCarousel";

const CarCard = ({ listing }) => (
    <div className="bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-neutral-200">
        <img
          src={listing.images[0]?.url || '/placeholder-car.jpg'}
          alt={`${listing.make} ${listing.model}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
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
        <div className="text-sm text-neutral-600 mt-1">
          Ends: {listing.type === "Fixed price" ? "Not Applicable" : new Date(listing.end_date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

const LandingPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
          try {
            const listingsResponse = await listingService.getAllListings();
    
            const activeListings = listingsResponse.filter(
              listing => 
                listing.approval_status === 'approved' && 
                !listing.is_deleted && 
                listing.status === 'active'
            );

            const threeListings = activeListings.slice(-3);
    
            setListings(threeListings);
          } catch (err) {
            setError('Failed to fetch data');
            console.error('Error fetching data:', err);
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, []);


    return (
        <>
        < Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Image */}
        <div className="w-full h-[300px] mb-12 relative overflow-hidden rounded-lg">
            <img
            src={homeBanner}
            alt="Featured Classic Car"
            className="w-full h-full object-cover"
            />
        </div>

        {/* Record Price Section */}
        {/* <div className="mb-16"> */}
        < RecordPriceCarousel />
          

        {/* Live Auctions Section */}
        <div>
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Live Listings</h2>
            <Link to="/listings" className="text-blue-600 hover:text-blue-700">
                See All
            </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map(listing => (
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
        
        < Footer />
        </>
        );
}

export default LandingPage;