import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-200 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Know More Section */}
          <div>
            <h3 className="font-semibold mb-4">Know More</h3>
            <ul className="space-y-2">
              <li>
                <a href="/buy" className="hover:text-gray-600">
                  Buy
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-gray-600">
                  Request an estimate
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-gray-600">
                  Help
                </a>
              </li>
            </ul>
          </div>

          {/* About Us Section */}
          <div>
            <h3 className="font-semibold mb-4">About Us</h3>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="hover:text-gray-600">
                  Who we are
                </a>
              </li>
            </ul>
            {/* Social Media Icons */}
            <div className="flex space-x-4 mt-4">
              <a href="#" className="hover:text-gray-600">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-gray-600">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-gray-600">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-gray-600">
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Newsletter Section */}
          <div>
            <h3 className="font-semibold mb-4">Stay Up-to-date with Us</h3>
            <form className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 border border-gray-300 flex-grow"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-sm text-gray-600 border-t border-gray-200 pt-4">
          © 2025 Timeless Motors. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;