import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWishlist, removeFromWishlistAsync, clearWishlist } from '../../redux/wishlistSlice';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ShoppingCart, Trash2, Heart, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

const CarCard = ({ listing, onCardClick, onRemove }) => (
  <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
    <div 
      className="cursor-pointer"
      onClick={onCardClick}
    >
      <div className="relative h-48 bg-neutral-200">
        <img
          src={listing.images[0]?.url || '/placeholder-car.jpg'}
          alt={`${listing.make} ${listing.model}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg">{`${listing.year} ${listing.make} ${listing.model}`}</h3>
        <div className="text-sm text-neutral-600 mt-1">{listing.body_type}</div>
        <div className="text-xl font-bold mt-2">
          ₹ {listing.current_bid > 0 ? listing.current_bid.toLocaleString() : listing.starting_bid.toLocaleString()}
        </div>
        <div className="flex justify-between items-center mt-3">
          <div className="text-sm font-medium text-neutral-700">{listing.type}</div>
          <div className="text-sm font-medium text-neutral-700">{listing.bid_count} Bids</div>
        </div>
        <div className="text-sm text-neutral-600 mt-2 flex items-center">
          <span className="font-medium">Ends:</span>
          <span className="ml-2">{new Date(listing.end_date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
    <button
      onClick={onRemove}
      className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-500 p-2 rounded-full 
                 shadow-md hover:bg-red-500 hover:text-white transition-all duration-300 
                 transform hover:scale-110 group-hover:opacity-100 opacity-0"
      title="Remove from wishlist"
    >
      <Trash2 size={18} />
    </button>
  </div>
);

const EmptyWishlist = ({ onShopNow }) => (
  <div className="text-center bg-white rounded-xl p-12 border border-gray-100 shadow-sm">
    <div className="flex justify-center mb-6">
      <Heart className="w-16 h-16 text-gray-300" />
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Wishlist is Empty</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Discover and save your favorite listings to keep track of the cars you're interested in.
    </p>
    <button
      onClick={onShopNow}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 
                 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 
                 flex items-center justify-center mx-auto"
    >
      <ShoppingCart className="mr-2" size={20} />
      Browse Listings
    </button>
  </div>
);

const Wishlist = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWishlist())
        .unwrap()
        .catch((error) => {
          toast.error('Failed to load wishlist');
          console.error('Wishlist Fetch Error:', error);
        });
    }
  }, [dispatch, isAuthenticated]);

  const handleRemoveItem = (event, itemId) => {
    event.stopPropagation();
    toast.promise(
      dispatch(removeFromWishlistAsync(itemId))
        .unwrap()
        .then(() => dispatch(fetchWishlist())),
      {
        loading: 'Removing item...',
        success: 'Item removed from wishlist',
        error: 'Failed to remove item'
      }
    );
  };

  const handleClearWishlist = () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      dispatch(clearWishlist());
      toast.success('Wishlist cleared successfully');
    }
  };

  const handleListingClick = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">My Wishlist</h2>
          {items.length > 0 && items.some(item => item.items.length > 0) && (
            <button
              onClick={handleClearWishlist}
              className="flex items-center px-4 py-2 text-red-500 hover:text-red-600 
                       hover:bg-red-50 rounded-lg transition duration-300"
            >
              <Trash2 size={18} className="mr-2" />
              Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : items.length === 0 || items.every(item => item.items.length === 0) ? (
          <EmptyWishlist onShopNow={() => navigate('/listings')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              item.items.map((subItem) => (
                <CarCard
                  key={subItem._id}
                  listing={subItem.product}
                  onCardClick={() => handleListingClick(subItem.product._id)}
                  onRemove={(e) => handleRemoveItem(e, subItem.product._id)}
                />
              ))
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Wishlist;