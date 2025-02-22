import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listingService } from "../utils/api";
import { useNavigate } from 'react-router-dom';

const RecordPriceCarousel = () => {
  const [recordListings, setRecordListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate()
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    loop: true,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 3 }
    }
  });

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  useEffect(() => {
    const fetchRecordPrices = async () => {
      try {
        const listingsResponse = await listingService.getAllListings();
        
        // Filter for completed auctions and sort by price
        const soldListings = listingsResponse
          .filter(listing => 
            listing.status === 'sold' || 
            (listing.type === 'Auction' && new Date(listing.end_date) < new Date())
          )
          .sort((a, b) => {
            const priceA = a.current_bid ?? a.starting_bid;
            const priceB = b.current_bid ?? b.starting_bid;
            return priceB - priceA;
          })
          .slice(0, 6); // Get top 6 highest priced listings

        setRecordListings(soldListings);
      } catch (err) {
        setError('Failed to fetch record prices');
        console.error('Error fetching record prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecordPrices();
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Record Price</h2>
        <div className="flex gap-2">
          <button 
            onClick={scrollPrev}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={scrollNext}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {recordListings.map((listing) => (
            <div key={listing._id } onClick={()=> navigate(`/listing/${listing._id}`)} className="flex-[0_0_100%] md:flex-[0_0_33.33%] px-3 cursor-pointer">
              <div className="bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-transform duration-300 hover:scale-105">
                <div className="relative h-48 bg-neutral-200">
                  <img
                    src={listing.images[0]?.url || '/placeholder-car.jpg'}
                    alt={`${listing.year} ${listing.make} ${listing.model}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className='p-4'>
                    <h3 className="font-medium mb-2">
                    {`${listing.year} ${listing.make} ${listing.model}`}
                    </h3>
                    <div className="flex justify-between items-baseline mb-2">
                    <div className="text-lg font-semibold">
                        ₹ {(listing.final_price || listing.current_bid).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">{listing.bid_count} Bids</div>
                    </div>
                    <div className="text-sm text-gray-600">
                    <div>Inclusive 15% Margin</div>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecordPriceCarousel;