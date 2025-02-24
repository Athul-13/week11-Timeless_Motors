import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, Timer } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { toast, Toaster } from 'react-hot-toast';
import { fetchCart, removeFromCart } from '../../redux/cartSlice';

const CartItem = ({ listing, onCardClick, onRemove, isSelected, onSelect, addedAt }) => {
  const price = listing.type === 'Auction' 
    ? listing.current_bid 
    : listing.starting_bid;

  const auctionEndTime = listing.type === 'Auction' 
    ? new Date(listing.addedAt).getTime() + (2 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div 
      className={`flex group relative bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg 
                  transition-all duration-300 cursor-pointer ${isSelected ? 'ring-2 ring-indigo-600' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(listing);
      }}
    >
      <div className="w-44 h-32 flex-shrink-0">
        <img
          src={listing.images[0]?.url || '/placeholder-car.jpg'}
          alt={`${listing.make} ${listing.model}`}
          className="w-full h-full object-fill p-2"
        />
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>
      <div className="flex-grow p-4">
        <h3 className="font-medium text-lg text-gray-800">{`${listing.year} ${listing.make} ${listing.model}`}</h3>
        <p className="text-sm text-gray-500 mt-1">{listing.body_type}</p>
        <div className="mt-2 text-lg font-bold text-indigo-600">
          ₹ {price?.toLocaleString()}
        </div>
        {listing.type === 'Auction' && (
           <CountdownTimer addedAt={addedAt} />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e, listing._id);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur text-red-500 p-2 rounded-full 
                     shadow-md hover:bg-red-500 hover:text-white transition-all duration-300 
                     transform hover:scale-110 group-hover:opacity-100 opacity-0"
          title="Remove from cart"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const CartSummary = ({ item, onCheckout }) => {
  if (!item) return null;

  const price = item.type === 'Auction' ? item.current_bid : item.starting_bid;
  const tax = price * 0.18;
  const total = price + tax;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Item Price</span>
          <span className="text-gray-800">₹ {price?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-800">₹ {tax.toLocaleString()}</span>
        </div>
        <div className="h-px bg-gray-200 my-4"></div>
        <div className="flex justify-between font-semibold text-lg">
          <span className="text-gray-800">Total</span>
          <span className="text-gray-800">₹ {total.toLocaleString()}</span>
        </div>
      </div>
      <button
        onClick={onCheckout}
        className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg 
                   font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
      >
        <ShoppingBag size={20} />
        Proceed to Checkout
      </button>
    </div>
  );
};

const EmptyCart = ({ onShopNow }) => (
  <div className="text-center bg-white rounded-xl p-12 border border-gray-100 shadow-sm">
    <div className="flex justify-center mb-6">
      <ShoppingBag className="w-16 h-16 text-gray-300" />
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Cart is Empty</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Looks like you haven't added any items to your cart yet.
    </p>
    <button
      onClick={onShopNow}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 
                 rounded-lg transition duration-300 flex items-center justify-center mx-auto"
    >
      <ShoppingBag className="mr-2" size={20} />
      Start Shopping
    </button>
  </div>
);

const CountdownTimer = ({ addedAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const addedTime = new Date(addedAt).getTime();
      const endTime = addedTime + (48 * 60 * 60 * 1000); // 48 hours in milliseconds
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        return 'Expired';
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m remaining`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [addedAt]);

  return (
    <div className="flex items-center gap-2 text-orange-600 font-medium mt-2">
      <Timer size={16} />
      <span>{timeLeft}</span>
    </div>
  );
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      setIsInitialLoad(true);
      dispatch(fetchCart())
        .unwrap()
        .then(() => {
          setIsInitialLoad(false);
        })
        .catch((error) => {
          setIsInitialLoad(false); 
          toast.error('Failed to load cart');
          console.error('Cart Fetch Error:', error);
        });
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Set the first item as selected by default when cart loads
    if (!isInitialLoad && items?.length > 0 && items[0]?.items?.length > 0) {
      setSelectedItem(items[0].items[0].product);
    }
  }, [items, isInitialLoad]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleRemoveItem = (event, productId) => {
    event.stopPropagation();
    toast.promise(
      dispatch(removeFromCart(productId))
        .unwrap()
        .then(() => {
          dispatch(fetchCart());
          if (selectedItem?._id === productId) {
            // If selected item was removed, select the next available item
            const remainingItems = items?.flatMap(item => 
              item.items.filter(subItem => subItem.product._id !== productId)
            );
            setSelectedItem(remainingItems[0]?.product || null);
          }
        }),
      {
        loading: 'Removing item...',
        success: 'Item removed from cart',
        error: 'Failed to remove item',
      }
    );
  };

  const handleCheckout = () => {
    if (selectedItem) {
      navigate('/checkout',{ state: { selectedItemId: selectedItem._id } });
    }
  };

  const allCartItems = items?.flatMap(item => item.items);
  const hasItems = allCartItems.length > 0;


  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h2>

        {(isInitialLoad || loading)  ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : !hasItems ? (
          <EmptyCart onShopNow={() => navigate('/listings')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {allCartItems.map((item) => (
                <CartItem
                  key={item._id}
                  listing={item.product}
                  addedAt={item.addedAt} 
                  onCardClick={() => {}}
                  onRemove={handleRemoveItem}
                  isSelected={selectedItem?._id === item.product._id}
                  onSelect={setSelectedItem}
                />
              ))}
              <div className="text-sm text-gray-500 mt-4">
                Click on an item to select it for checkout
              </div>
            </div>

            <div className="lg:col-span-1">
              <CartSummary
                item={selectedItem}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Cart;