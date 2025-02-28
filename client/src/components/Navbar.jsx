import { forwardRef, useEffect, useRef, useState } from "react";
import { Menu, X, ShoppingCart, Heart, Bell, LogOut, Trophy, ShoppingBag, TrendingUp, Clock, Gavel, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";
import { fetchWishlist } from "../redux/wishlistSlice";
import { fetchCart } from "../redux/cartSlice";
import { useSocket } from "../utils/socketContext";
import { notificationService } from "../utils/api";

const NotificationDropdown = forwardRef(({ notifications, onClose, onMarkAsRead }, ref) => {
  const navigate = useNavigate();

  const handleNotificationClick = async (notification, action) => {
    // Mark as read first
    await onMarkAsRead(notification._id);
    
    // Then perform navigation/action
    onClose();
    action();
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case 'message':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => handleNotificationClick(notification, () => 
              navigate(`/profile/inbox?chatId=${notification.data.chatId}`)
            )}
          >
            <div className="flex items-center gap-3">
              <img
                src={notification.data.senderId.profile_picture || '/default-avatar.png'}
                alt="Sender"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">
                  {notification.data.senderId.first_name} {notification.data.senderId.last_name}
                </p>
                <p className="text-sm text-gray-600 truncate">{notification.data.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        );
  
      case 'bid_won':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => handleNotificationClick(notification, () =>
              navigate(`/listings/${notification.data.listingId._id}`)
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-600">Bid Won!</p>
                <p className="text-sm">
                  {notification.data.listingId.make} {notification.data.listingId.model}
                </p>
                <p className="text-sm text-gray-600">
                  Winning bid: ${notification.data.bidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
  
      case 'bid_lost':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            // onClick={() => handleNotificationClick(notification, () =>
            //   navigate(`/listings/${notification.data.listingId._id}`)
            // )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-600">Bid Lost</p>
                <p className="text-sm">
                  {notification.data.listingId.make} {notification.data.listingId.model}
                </p>
                <p className="text-sm text-gray-600">
                  Final price: ${notification.data.bidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
  
      case 'bid_placed':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            // onClick={() => handleNotificationClick(notification, () =>
            //   navigate(`/listings/${notification.data.listingId._id}`)
            // )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Gavel className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-600">Bid Placed</p>
                <p className="text-sm">
                  {notification.data.listingId.make} {notification.data.listingId.model}
                </p>
                <p className="text-sm text-gray-600">
                  Your bid: ${notification.data.bidAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
  
      case 'listing_ended':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            // onClick={() => handleNotificationClick(notification, () =>
            //   navigate(`/listings/${notification.data.listingId._id}`)
            // )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-600">Listing Ended</p>
                <p className="text-sm">
                  {notification.data.listingId.make} {notification.data.listingId.model}
                </p>
                <p className="text-sm text-gray-600">{notification.data.description}</p>
              </div>
            </div>
          </div>
        );
  
      case 'overbid':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            // onClick={() => handleNotificationClick(notification, () =>
            //   navigate(`/listings/${notification.data.listingId._id}`)
            // )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-600">You've Been Outbid!</p>
                <p className="text-sm">
                  {notification.data.description}
                </p>
              </div>
            </div>
          </div>
        );
  
      case 'order_received':
        return (
          <div
            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            onClick={() => handleNotificationClick(notification, () =>
              navigate(`/profile/sales/${notification.data.orderId}`)
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-600">New Order!</p>
                <p className="text-sm">{notification.data.title}</p>
                <p className="text-sm text-gray-600">{notification.data.description}</p>
              </div>
            </div>
          </div>
        );
  
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="absolute right-0 top-10 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border" role="menu">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <button
              onClick={() => onMarkAsRead('all')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`${!notification.read ? 'bg-blue-50' : ''} rounded-lg`}
              >
                {renderNotificationContent(notification)}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No new notifications</p>
          )}
        </div>
      </div>
    </div>
  );
});

NotificationDropdown.displayName = 'NotificationDropdown';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const {isAuthenticated, user} = useSelector((state) => state.auth);
  const {items: wishlistItem} = useSelector((state) => state.wishlist);
  const {items: cartItem} = useSelector((state) => state.cart);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    dispatch(fetchWishlist());
    dispatch(fetchCart());
  }, [dispatch]);

  // Function to handle fetching notifications
  const fetchNotifications = async () => {
    try {
      const data = await notificationService.fetchNotification();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socket.on('newNotification', handleNewNotification);
    
    // Fetch existing notifications on mount
    fetchNotifications();

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [socket]);

  useEffect(() => {
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      if (notificationId === 'all') {
        await notificationService.markAllAsRead()

        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({
            ...notification,
            read: true
          }))
        );
      } else {
        await notificationService.markAsRead(notificationId)
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const handleClickOutside = (event) => {
    if (notificationRef.current && !notificationRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
  };

  const cartCount = cartItem?.[0]?.items?.length ?? 0;
  const wishlistCount = wishlistItem?.[0]?.items?.length ?? 0;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/");
  };

  return (
    <div className="relative">
      <nav className="bg-gray-200 py-4 px-6 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Mobile: Left section with hamburger */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile: Right section with notification bell */}
          <div className="flex items-center md:hidden">
            {isAuthenticated && (
              <div className="relative">
                <button
                    onClick={handleNotificationClick}
                    className="relative inline-flex items-center focus:outline-none"
                  >
                    <Bell size={24} className="text-gray-700" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationDropdown
                      ref={notificationRef}
                      notifications={notifications}
                      onClose={handleCloseNotifications}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  )}
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
            <Link to="/" className="text-3xl font-bold text-gray-800">
              Timeless Motors
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="flex items-center space-x-6">
              <Link to="/listings" className="py-2 hover:text-gray-700 text-lg font-bold">
                Auctions <span className="font-bold">+</span>
              </Link>
              <Link to="/addlisting" className="py-2 hover:text-gray-700 text-lg font-bold">
                Thinking of selling?
              </Link>
              <Link to="/faqs" className="py-2 hover:text-gray-700 text-lg font-bold">
                FAQs
              </Link>
              <Link to="/contact" className="py-2 hover:text-gray-700 text-lg font-bold">
                Contact
              </Link>
              <Link to="/about" className="py-2 hover:text-gray-700 text-lg font-bold">
                more
              </Link>
            </div>
          </div>

          {/* Desktop: User controls */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-800">Welcome, <Link to='/profile/profileDetails' className="text-blue-500 hover:underline">{user.first_name}!</Link></span>
                <Link to="/cart" className="text-gray-700 hover:text-gray-900 relative inline-flex items-center">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link to="/wishlist" className="text-gray-700 hover:text-gray-900 relative inline-flex items-center">
                  <Heart size={24} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <div className="text-gray-700 hover:text-gray-900 relative inline-flex items-center">
                  <button
                    onClick={handleNotificationClick}
                    className="relative inline-flex items-center focus:outline-none"
                  >
                    <Bell size={24} className="text-gray-700" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationDropdown
                      ref={notificationRef}
                      notifications={notifications}
                      onClose={handleCloseNotifications}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  )}
                </div>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-700 hover:text-gray-900"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors font-bold">
                  LOGIN
                </Link>
                <Link to="/signup" className="px-4 py-2 border-2 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors font-bold">
                  SIGNUP
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile: Navigation menu - Now with proper z-index and positioning */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute top-15 left-0 right-0 bg-white shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-4">
              <div className="flex flex-col space-y-4">
                <Link to="/listings" className="py-2 hover:text-gray-700 text-lg font-bold">
                  Auctions <span className="font-bold">+</span>
                </Link>
                <Link to="/addlisting" className="py-2 hover:text-gray-700 text-lg font-bold">
                  Thinking of selling?
                </Link>
                <Link to="/faqs" className="py-2 hover:text-gray-700 text-lg font-bold">
                  FAQs
                </Link>
                <Link to="/contact" className="py-2 hover:text-gray-700 text-lg font-bold">
                  Contact
                </Link>
                <Link to="/about" className="py-2 hover:text-gray-700 text-lg font-bold">
                  more
                </Link>
              </div>
              {isAuthenticated ? (
                <div className="flex flex-col space-y-4 mt-4 border-t pt-4">
                  <Link to="/cart" className="flex items-center space-x-2">
                    <ShoppingCart size={24} />
                    <span>Cart ({cartCount})</span>
                  </Link>
                  <Link to="/wishlist" className="flex items-center space-x-2">
                    <Heart size={24} />
                    <span>Wishlist ({wishlistCount})</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-700"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 mt-4 border-t pt-4">
                  <Link to="/login" className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors text-center">
                    LOGIN
                  </Link>
                  <Link to="/signup" className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors text-center">
                    SIGNUP
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;