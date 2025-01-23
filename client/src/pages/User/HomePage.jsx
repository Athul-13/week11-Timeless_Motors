import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import bently from '../../assets/bently-front.webp';
import buick from '../../assets/buick-side.jpeg';
import homeBanner from '../../assets/home-banner.jpg';
import RR from '../../assets/RR-front.jpg';
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listingService } from '../../utils/api';

const CarCard = ({ listing }) => {
  return (
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
          Ends: {new Date(listing.end_date).toLocaleDateString()}
        </div>
      </div>
    </div>
    )
  };


const HomePage = () => {
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
        <div className="mb-16">
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Record Price</h2>
            <div className="flex gap-2">
                <button className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeft size={24} />
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                <ChevronRight size={24} />
                </button>
            </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Car 1 */}
            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="aspect-video w-full overflow-hidden mb-4">
                <img
                    src={buick}
                    alt="1949 Buick Super"
                    className="w-full h-full object-cover"
                />
                </div>
                <h3 className="text-lg font-medium mb-2">1949 Buick Super</h3>
                <div className="flex justify-between items-baseline mb-2">
                <div className="text-lg font-semibold">₹ 76,925.00</div>
                <div className="text-sm text-gray-600">10 Bids</div>
                </div>
                <div className="text-sm text-gray-600">
                <div>Inclusive 15% Margin</div>
                </div>
            </div>

            {/* Car 2 */}
            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="aspect-video w-full overflow-hidden mb-4">
                <img
                    src={bently}
                    alt="2001 Bentley Continental Le Mans"
                    className="w-full h-full object-cover"
                />
                </div>
                <h3 className="text-lg font-medium mb-2">2001 Bentley Continental Le Mans</h3>
                <div className="flex justify-between items-baseline mb-2">
                <div className="text-lg font-semibold">$ 69,425.00</div>
                <div className="text-sm text-gray-600">18 Bids</div>
                </div>
                <div className="text-sm text-gray-600">
                <div>Inclusive 15% Margin</div>
                </div>
            </div>

            {/* Car 3 */}
            <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="aspect-video w-full overflow-hidden mb-4">
                <img
                    src={RR}
                    alt="Rolls Royce Silver Spirit"
                    className="w-full h-full object-cover"
                />
                </div>
                <h3 className="text-lg font-medium mb-2">Rolls Royce Silver Spirit</h3>
                <div className="flex justify-between items-baseline mb-2">
                <div className="text-lg font-semibold">$ 200,591.00</div>
                <div className="text-sm text-gray-600">29 Bids</div>
                </div>
                <div className="text-sm text-gray-600">
                <div>Inclusive 15% Margin</div>
                </div>
            </div>
            </div>
        </div>

        {/* Live Auctions Section */}
        <div>
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Live Auctions</h2>
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

export default HomePage;