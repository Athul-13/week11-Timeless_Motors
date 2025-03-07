import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, MapPin, ChevronDown, ChevronUp, CreditCard, Truck, Timer, Wallet } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { toast, Toaster } from 'react-hot-toast';
import { fetchCart, removeFromCart } from '../../redux/cartSlice';
import AddressManager from './AddressManager';
import { orderService, walletService } from '../../utils/api';
import RazorpayCheckout from '../../components/RazorpayCheckout';

const CartSummary = ({ subtotal, tax, total, onCheckout }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-gray-600">Subtotal</span>
        <span className="text-gray-800">₹ {subtotal.toLocaleString()}</span>
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
      <button
        onClick={onCheckout}
        className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-medium
                 hover:bg-indigo-700 transition-colors duration-300"
      >
        Place order
      </button>
    </div>
  </div>
);

const SelectedAddress = ({ address, onEdit }) => (
  <div className="bg-white rounded-xl shadow p-4 mb-6">
    <div className="flex justify-between items-start">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-500 mt-1" />
        <div>
          <h3 className="font-medium text-gray-800">{address.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {address.address}, {address.landmark}<br />
            {address.city}, {address.state} - {address.pincode}<br />
            {address.phone_number}
          </p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="text-indigo-600 text-sm hover:text-indigo-800"
      >
        Change
      </button>
    </div>
  </div>
);

const ListingSummary = ({ items, isOpen, onToggle, disabled, selectedItemId }) => {
  // Filter to show only the selected item
  const selectedItem = items
    .flatMap(item => item.items)
    .find(item => item.product._id === selectedItemId);

  if (!selectedItem) return null;

  return (
    <div className={`bg-white rounded-xl shadow mb-6 ${disabled ? 'opacity-50' : ''}`}>
      <button
        className="w-full px-6 py-4 flex justify-between items-center"
        onClick={onToggle}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-800">Selected Item</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="py-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-40 h-28 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={selectedItem.product.images[0]?.url || '/placeholder-car.jpg'}
                    alt={`${selectedItem.product.make} ${selectedItem.product.model}`}
                    className="w-full h-full object-cover p-2"
                  />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-medium text-gray-800">
                    {`${selectedItem.product.year} ${selectedItem.product.make} ${selectedItem.product.model}`}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedItem.product.body_type}
                  </p>
                  {selectedItem.product.type === 'Auction' && (
                    <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                      <Timer size={16} />
                      <span>48h remaining</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-800">
                  ₹ {(selectedItem.product.type === 'Auction' ? 
                      selectedItem.product.current_bid : 
                      selectedItem.product.starting_bid).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedItem.product.type}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentMethodSelector = ({ onSelect, onClose, disabled, walletBalance }) => (
    <div className={`bg-white rounded-xl shadow p-4 mb-6 ${disabled ? 'opacity-50' : ''}`}>
        <h3 className="font-medium text-gray-800 mb-4">Select Payment Method</h3>
        <div className="space-y-3">
        <RazorpayCheckout onSelect={onSelect} disabled={disabled} />

        <button
            disabled={disabled || walletBalance < 1}  // Disable if balance is zero
            onClick={() => onSelect({
                type: 'wallet',
                label: 'Wallet Payment',
                icon: Wallet 
            })}
            className={`w-full flex items-center gap-3 p-3 border rounded-lg 
            ${!disabled && walletBalance >= 1 ? 'hover:border-indigo-600' : 'opacity-50'} 
            transition-colors`}
        >
            <Wallet className="w-5 h-5 text-gray-500" />
            <div className="flex-1 text-left">
                <div className="font-medium text-gray-800">Wallet</div>
                <div className="text-sm text-gray-500">
                    Balance: ₹{walletBalance.toFixed(2)}
                </div>
            </div>
        </button>

        <button
            disabled={disabled}
            onClick={() => onSelect({
            type: 'cod',
            label: 'Cash on Delivery',
            icon: Truck 
            })}
            className={`w-full flex items-center gap-3 p-3 border rounded-lg ${!disabled && 'hover:border-indigo-600'} transition-colors`}
        >
            <Truck className="w-5 h-5 text-gray-500" />
            <div className="flex-1 text-left">
            <div className="font-medium text-gray-800">Cash on Delivery</div>
            <div className="text-sm text-gray-500">Pay when you receive your order</div>
            </div>
        </button>
        </div>
    </div>
);

const SelectedPaymentMethod = ({ paymentMethod, onEdit }) => (
    <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
            <paymentMethod.icon className="w-5 h-5 text-gray-500 mt-1" />
            <div>
            <h3 className="font-medium text-gray-800">{paymentMethod.label}</h3>
            <p className="text-sm text-gray-600 mt-1">
                {paymentMethod.type === 'credit_card' 
                ? 'Pay securely with your credit card'
                : 'Pay when you receive your order'}
            </p>
            </div>
        </div>
        <button
            onClick={onEdit}
            className="text-indigo-600 text-sm hover:text-indigo-800"
        >
            Change
        </button>
        </div>
    </div>
);

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation()
  const selectedItemId = location.state?.selectedItemId;
  const { items, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showAddressManager, setShowAddressManager] = useState(true);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showListings, setShowListings] = useState(false);
  const [isListingsEnabled, setIsListingsEnabled] = useState(false);
  const [isPaymentEnabled, setIsPaymentEnabled] = useState(false); 
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
      const fetchBalance = async () => {
        const balance = await walletService.fetchWallet();
        setWalletBalance(balance.balance);
      };
    
      fetchBalance();
    }, []);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
        .unwrap()
        .catch((error) => {
          toast.error('Failed to load cart');
          console.error('Cart Fetch Error:', error);
        });
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleAddressSelection = (address) => {
    setSelectedAddress(address);
    setShowAddressManager(false);
    setIsPaymentEnabled(true);  
    setShowPaymentSelector(true);
  };

  const handleEditAddress = () => {
    setShowAddressManager(true);
  };

  const handlePaymentSelection = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentSelector(false);
    setIsListingsEnabled(true);
    setShowListings(true);
  };

  const handleEditPayment = () => {
    setShowPaymentSelector(true);
  };

  const calculateTotals = () => {
    // Find the selected item from all cart items
    const selectedItem = items
      .flatMap(item => item.items)
      .find(item => item.product._id === selectedItemId);
  
    if (!selectedItem) {
      return { subtotal: 0, tax: 0, total: 0 };
    }
  
    // Calculate price based on item type
    const subtotal = selectedItem.product.type === 'Auction' 
      ? selectedItem.product.current_bid || 0
      : selectedItem.product.starting_bid || 0;
  
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
  
    return { subtotal, tax, total };
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedPaymentMethod) {
      toast.error('Please select both shipping address and payment method');
      return;
    }

    const productCheck = await orderService.checkProductAvailability(selectedItemId);
    if (!productCheck || productCheck.status === 'sold') {
      toast.error('Sorry, this item is no longer available.');
      return;
    }
    
    try {
      const item = items.find(cartItem => 
        cartItem.items.some(subItem => subItem.product._id === selectedItemId)
      );
  
      if (!item) {
        toast.error('Selected item not found');
        return;
      }
  
      const product = item.items.find(subItem => 
        subItem.product._id === selectedItemId
      ).product;
  
      // Calculate price and tax
      const priceAmount = product.type === 'Auction' ? product.current_bid : product.starting_bid;
      const taxAmount = priceAmount * 0.18; // 18% GST
      const totalAmount = priceAmount + taxAmount;
      const adminCommission = priceAmount * 0.10; // Assuming 10% commission
      const sellerAmount = priceAmount - adminCommission;
  
      // Construct order data matching the schema
      const orderData = {
        product: selectedItemId,
        orderType: product.type === 'Auction' ? 'Auction' : 'Fixed price',
        price: {
          amount: priceAmount,
          currency: 'INR'
        },
        tax: {
          amount: taxAmount,
          percentage: 18
        },
        totalAmount,
        payment: {
          method: selectedPaymentMethod.type,
          status: 'Pending'
        },
        shippingAddress: {
          name: selectedAddress.name,
          address: selectedAddress.address,
          landmark: selectedAddress.landmark,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          phone_number: selectedAddress.phone_number,
          country: selectedAddress.country
        }
      };
  
      // Add auction details if it's an auction item
      if (product.type === 'Auction') {
        orderData.auctionDetails = {
          bidPrice: product.current_bid,
          bidEndTime: product.end_date,
          timeRemaining: new Date(product.end_date) - new Date()
        };
      }

      if (selectedPaymentMethod.type === 'razorpay') {
        // Initialize Razorpay
        const res = await selectedPaymentMethod.handler();
        if (!res) {
          toast.error('Failed to load Razorpay SDK');
          return;
        }
        const totalAmount = priceAmount + taxAmount
  
        // Create Razorpay order
        const razorpayOrder = await orderService.createRazorpayOrder({
          amount: totalAmount
        });

        // Configure Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: 'Timeless Motors',
        description: `Payment for ${product.make} ${product.model}`,
        handler: async (response) => {
          let paymentVerified = false;
          let paymentError = null;
          
          // Step 1: Try to verify the payment
          try {
            const verificationResult = await orderService.verifyPayment(response);
            paymentVerified = verificationResult.success;
          } catch (error) {
            console.error('Payment verification error:', error);
            paymentError = error;
          }
          
          // Step 2: Create the order regardless of verification outcome
          try {
            const orderResponse = await orderService.createOrder({
              ...orderData,
              payment: {
                ...orderData.payment,
                razorpay_order_id: razorpayOrder.id,
                razorpay_payment_id: response.razorpay_payment_id || null,
                status: paymentVerified ? 'Completed' : 'Pending'
              }
            });
            
            if (orderResponse.success) {
              if (paymentVerified) {
                toast.success('Order placed successfully with payment confirmed');
                // Only remove from cart if it's not an auction item
                if (product.type !== 'Auction') {
                  dispatch(removeFromCart(selectedItemId));
                }
              } else {
                toast.warning('Order created with pending payment status. You can retry payment later.');
              }
              
              navigate(`/orders/${orderResponse.order._id}`);
            }
          } catch (orderError) {
            toast.error('Failed to create order');
            console.error('Order Creation Error:', orderError);
          }
        },
        prefill: {
          name: selectedAddress.name,
          contact: selectedAddress.phone_number
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: async function () {
            try {
              const orderResponse = await orderService.createOrder({
                ...orderData,
                payment: {
                  ...orderData.payment,
                  razorpay_order_id: razorpayOrder.id,
                  razorpay_payment_id: null,
                  status: 'Pending'
                }
              });
      
              if (orderResponse.success) {
                if (product.type !== 'Auction') {
                  dispatch(removeFromCart(selectedItemId));
                }
                navigate(`/orders/${orderResponse.order._id}`);
              }
            } catch (orderError) {
              toast.error('Failed to create order');
              console.error('Order Creation Error:', orderError);
            }
          }
        }
      };
  
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      } else {
        // Handle COD order creation
        const response = await orderService.createOrder(orderData);
        if (response.success) {
          toast.success('Order placed successfully');
          dispatch(removeFromCart(selectedItemId));
          navigate(`/orders/${response.order._id}`);
        }
      }

    } catch (error) {
      toast.error(error.message || 'Failed to place order');
      console.error('Place Order Error:', error);
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Checkout</h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {showAddressManager ? (
                <AddressManager
                  selectionEnabled={true}
                  onSelect={handleAddressSelection}
                  selectedAddressId={selectedAddress?._id}
                  className="mb-6"
                />
              ) : (
                <SelectedAddress
                  address={selectedAddress}
                  onEdit={handleEditAddress}
                />
              )}

            {/* Payment Method Selection */}
            {showPaymentSelector || !selectedPaymentMethod ? (
                <PaymentMethodSelector
                onSelect={handlePaymentSelection}
                onClose={() => setShowPaymentSelector(false)}
                disabled={!isPaymentEnabled}
                walletBalance={walletBalance}
                />
            ) : (
                <SelectedPaymentMethod
                paymentMethod={selectedPaymentMethod}
                onEdit={handleEditPayment}
                />
            )}

              <ListingSummary
                items={items}
                isOpen={showListings}
                onToggle={() => selectedAddress && setShowListings(!showListings)}
                disabled={!isListingsEnabled}
                selectedItemId={selectedItemId}
              />
            </div>

            <div className="lg:col-span-1">
              <CartSummary
                {...calculateTotals()}
                onCheckout={() => {
                  if (!selectedAddress) {
                    toast.error('Please select a delivery address')
                    return;
                  }
                  if (!selectedPaymentMethod) {
                    toast.error('Please select a payment method')
                  }
                  handlePlaceOrder();
                }}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Checkout;  