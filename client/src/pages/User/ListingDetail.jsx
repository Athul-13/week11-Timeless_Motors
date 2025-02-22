import { useState, useEffect } from 'react';
import { Heart, X, ShoppingCart } from 'lucide-react';
import { Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { listingService } from '../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlistAsync, fetchWishlist, removeFromWishlistAsync } from '../../redux/wishlistSlice';
import { addToCart, fetchCart, removeFromCart } from '../../redux/cartSlice';
import { useSocket } from '../../utils/socketContext';

const ListingDetail = () => {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showEndedDialog, setShowEndedDialog] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [message, setMessage] = useState('');
  const [socketReady, setSocketReady] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socket = useSocket();
  const { id } = useParams();
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await listingService.getListingById(id);
        if (!response) {
            throw new Error('Listing not found');
        }

        const listingData = response.data;

        if (listingData.is_deleted) {
            throw new Error('This listing has been deleted');
        }

        if (listingData.approval_status !== 'approved') {
            throw new Error(`Listing status is ${listingData.approval_status}`);
        }
        
        setListing(listingData);
      } catch (err) {
        console.error('Error fetching listing:', err);
        setError(err.message || 'Failed to fetch listing details');
        toast.error('Failed to fetch listing details');
      } finally {
        setLoading(false);
      }
    };

    const checkIfWishlisted = async () => {
      if (!userId) return;

      try {
        const resultAction = await dispatch(fetchWishlist());
        
        if (fetchWishlist.fulfilled.match(resultAction)) {
          const wishlistResponse = resultAction.payload;
    
          if (Array.isArray(wishlistResponse) && wishlistResponse.length > 0) {
            const items = wishlistResponse[0].items;

            console.log('item:', items);
    
            const isProductInWishlist = items.some(item => item.product._id.toString() === id);
            setIsWishlisted(isProductInWishlist);
          } else {
            console.error('Wishlist response is empty or not an array:', wishlistResponse);
          }
        } else {
          console.error('Error fetching wishlist:', resultAction.payload || 'Something went wrong');
        }
      } catch (err) {
        console.error('Error fetching wishlist status:', err);
      }
    };

    const checkIfInCart = async () => {
      if (!userId) return;

      try {
        const resultAction = await dispatch(fetchCart());

        if (fetchCart.fulfilled.match(resultAction)) {
          const cartItems = resultAction.payload;

          if (cartItems && Array.isArray(cartItems)) {
            // If response is an array of items directly
            const isProductInCart = cartItems.some(item => 
              item.product && item.product._id.toString() === id
            );

            setIsInCart(isProductInCart);
          } else if (cartItems && Array.isArray(cartItems[0]?.items)) {
            const isProductInCart = cartItems[0].items.some(item => 
              item.product && item.product._id.toString() === id
            );
            setIsInCart(isProductInCart);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error)
      }
    }

    if (id) {
      fetchListing();
      checkIfWishlisted();
      checkIfInCart();
    }
  }, [id,dispatch]);

  useEffect(() => {
    if (socket && userId) {
        setSocketReady(true);
        socket.on('newMessage', (data) => {
            console.log('Message sent successfully', data);
            toast.success('Message sent to seller');
        });

        socket.on('messageError', (error) => {
            console.error('Failed to send message:', error);
            toast.error(error.message || 'Failed to send message');
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageError');
        };
    }
  }, [socket, userId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to listings
          </button>
          <div className="text-center py-12">
            <p className="text-gray-600">Loading listing details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to listings
          </button>
          <div className="text-center py-12 text-red-600">
            <p>{error}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to listings
          </button>
          <div className="text-center py-12">
            <p className="text-gray-600">Listing not found</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const nextImage = () => {
    if (!listing.images?.length) return;
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!listing.images?.length) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleAddToCart = async () => {
    if (!userId) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      if (isInCart) {
        dispatch(removeFromCart(id));
        toast.success('Removed from cart');
      } else {
        dispatch(addToCart(id));
        toast.success('Added to cart')
      }

      setIsInCart((prev)=> !prev);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart');
      setIsInCart((prev)=> !prev);
    }
  };

  const handleBid = async () => {
    if (!userId) {
      toast.error('Please login to place bids');
      return;
    }
    
    if(userId === listing.seller_id._id){
      toast.error('Sellers cannot place bid on their listings')
      return
    }

    const now = new Date().getTime();
    const endDate = new Date(listing.end_date).getTime();
    
    if (now > endDate) {
        setShowEndedDialog(true);
        return;
    }

    const minBid = (listing.current_bid > 0 ? listing.current_bid : listing.starting_bid) + (listing.minimum_increment || 0);

    if (bidAmount < minBid) {
        toast.error(`Bid must be at least ₹${minBid}`);
        return;
    }

    try {
        await listingService.placeBid(id, bidAmount);
        toast.success('Bid placed successfully!');
        setBidAmount('');

        const response = await listingService.getListingById(id);
        setListing(response.data);
    } catch (err) {
        console.error('Error placing bid:', err);
        toast.error('Failed to place bid');
    }
};

  const isAuctionEnded = () => {
    if (!listing.end_date) return false;
    const now = new Date().getTime();
    const endDate = new Date(listing.end_date).getTime();
    return now > endDate;
  };

  const handleWishlist = async () => {
    if (!userId) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        dispatch(removeFromWishlistAsync(id));
        toast.success('Removed from wishlist');
      } else {
        dispatch(addToWishlistAsync(id));
        toast.success('Added to wishlist');
      }
  
      setIsWishlisted((prev) => !prev);  // Safely flip the state
    } catch (err) {
      console.error('Error updating wishlist:', err);
      toast.error('Failed to update wishlist');
      setIsWishlisted((prev) => !prev); // Flip back if there's an error
    }
  };

  const formatPrice = (price) => {
    return price?.toLocaleString('en-US') || '0';
  };

  const calculateTimeLeft = () => {
    if (!listing.end_date) return 'No end date specified';
    
    const now = new Date().getTime();
    const endDate = new Date(listing.end_date).getTime();
    const timeLeft = endDate - now;

    if (timeLeft <= 0) return 'Auction ended';

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m left`;
  };


  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Please login to send messages');
      return;
    }

    if (!message.trim()) {
        return;
    }

    if (!socketReady) {
        toast.error('Chat connection not ready. Please try again in a moment.');
        return;
    }

    if (!socket?.connected) {
        toast.error('Chat connection failed. Please try again.');
        return;
    }

    // Check if user is logged in
    if (!userId) {
        toast.error('Please login to send messages');
        navigate('/login');
        return;
    }

    socket.emit('sendInitialMessage', {
        sellerId: listing.seller_id._id,
        listingId: listing._id,
        message: message.trim(),
    });

    setMessage('');
};

  return (
    <>
    < Toaster />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 mb-6 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to listings
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="relative">
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
        {listing.images?.length > 0 ? (
          <>
            <img
              src={listing.images[currentImageIndex].url}
              alt={`${listing.make} ${listing.model}`}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            />
            {/* Zoom Modal */}
            {isZoomed && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
                onClick={() => setIsZoomed(false)}
              >
                <div className="relative max-w-[90vw] max-h-[90vh]">
                  <img
                    src={listing.images[currentImageIndex].url}
                    alt={`${listing.make} ${listing.model}`}
                    className="max-w-full max-h-[90vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button 
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                    onClick={() => setIsZoomed(false)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-6 w-6" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        )}
        {listing.images?.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
            
            {/* Thumbnail Gallery */}
            {listing.images?.length > 0 && (
              <div className="flex mt-4 space-x-2 overflow-x-auto">
                {listing.images.map((image, index) => (
                  <button
                    key={image.public_id || index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden ${
                      index === currentImageIndex ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${listing.make} ${listing.model} thumbnail`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">
                {listing.year} {listing.make} {listing.model}
              </h1>
              <button 
                onClick={handleWishlist}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <Heart 
                  className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                />
                {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>


            {/* Current Price & Timer */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            {listing.type === 'Auction' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Starting Price</p>
                    <p className="text-xl font-semibold">₹{formatPrice(listing.starting_bid)}</p>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-2" />
                    {calculateTimeLeft()}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Bid</p>
                  <p className="text-2xl font-bold text-gray-700">
                    ₹{formatPrice(listing.current_bid || listing.starting_bid)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.bid_count || 0} bids so far
                  </p>
                </div>
                
                {listing.status === 'active' && !isAuctionEnded() && (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg"
                      placeholder={`Min bid: ₹${formatPrice(
                        (listing.current_bid > 0 ? listing.current_bid : listing.starting_bid) +
                        (listing.minimum_increment || 0)
                      )}`}
                    />
                    <button
                      onClick={handleBid}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Place Bid
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Fixed Price</p>
                  <p className="text-2xl font-bold">₹{formatPrice(listing.starting_bid)}</p>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isInCart ? 'Remove from Cart' : 'Add to Cart'}
                </button>
              </div>
            )}
          </div>

          <div className='mt-8'>
          <h2 className="text-xl font-semibold mb-4">Have a question?</h2>
         {userId ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 p-2 border rounded"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Please <button 
                onClick={() => navigate('/login')}
                className="text-blue-500 hover:underline"
              >
                login
              </button> to send messages to the seller</p>
            </div>
          )}
          </div>
            

            {/* Specifications */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Body Type</p>
                  <p className="font-medium">{listing.body_type || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-medium">{listing.fuel_type || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-medium">{listing.transmission_type || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Engine Capacity</p>
                  <p className="font-medium">{listing.cc_capacity ? `${listing.cc_capacity} cc` : 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{listing.description || 'No description available'}</p>
            </div>

            {/* Dialog for ended auction */}
            {showEndedDialog && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
                  <button 
                    onClick={() => setShowEndedDialog(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Auction Ended</h3>
                    <p className="text-gray-600 mb-4">
                      This auction has already ended. You can no longer place bids on this item.
                    </p>
                    <button
                      onClick={() => setShowEndedDialog(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ListingDetail;