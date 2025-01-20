import { useState } from "react";
import { Menu, X, ShoppingCart, Heart, Search, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/authSlice";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {isAuthenticated, user} = useSelector((state)=> state.auth)
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await dispatch(logout())
    navigate("/")
  }

  return (
    <nav className="bg-gray-200 py-4 px-6 relative">
      {/* Main navbar container */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Hamburger menu button - only visible on medium and smaller screens */}
        <button 
          onClick={toggleMenu}
          className="md:hidden text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo - centered on medium and smaller screens, left on larger */}
        <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none">
          <Link to="/" className="text-3xl font-bold text-gray-800">
            Timeless Motors
          </Link>
        </div>

        {/* Desktop navigation - hidden on medium and smaller screens */}
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

        {/* Login/Signup buttons - hidden on medium and smaller screens */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-800">Welcome, <Link to='/profile/profileDetails' className="text-blue-500 hover:underline">{user.first_name}!</Link> </span> {/* Display user's first name */}
              <Link to="/cart" className="text-gray-700 hover:text-gray-900">
                <ShoppingCart size={20} />
              </Link>
              <Link to="/wishlist" className="text-gray-700 hover:text-gray-900">
                <Heart size={20} />
              </Link>
              <Link to="/search" className="text-gray-700 hover:text-gray-900">
                <Search size={20} />
              </Link>
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

        {/* Mobile navigation menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-gray-100 p-4 md:hidden border-t border-gray-200">
            <div className="flex flex-col space-y-4">
            <Link to="/auctions" className="py-2 hover:text-gray-700 text-lg font-bold">
              Auctions <span className="font-bold">+</span>
            </Link>
            <Link to="/selling" className="py-2 hover:text-gray-700 text-lg font-bold">
              Thinking of selling?
            </Link>
            <Link to="/faqs" className="py-2 hover:text-gray-700 text-lg font-bold">
              FAQs
            </Link>
            <Link to="/contact" className="py-2 hover:text-gray-700 text-lg font-bold">
              Contact
            </Link>
            <Link to="/more" className="py-2 hover:text-gray-700 text-lg font-bold">
              more
            </Link>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
              <Link to="/login" className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors">
                LOGIN
              </Link>
              <Link to="/signup" className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors">
                SIGNUP
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
