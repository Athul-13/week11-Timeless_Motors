import { useState } from "react";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import bently from '../assets/bently-front.webp';
import buick from '../assets/buick-side.jpeg';
import RR from '../assets/RR-front.jpg';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Accordion = ({ items }) => {
  const [openItem, setOpenItem] = useState(null);

  const toggleItem = (value) => {
    setOpenItem((prev) => (prev === value ? null : value));
  };

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className="bg-gray-100 border-gray-300">
          <button
            onClick={() => toggleItem(item.value)}
            className="w-full flex justify-between items-center px-4 py-2 border-b"
          >
            {item.label}
            {openItem === item.value ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
          {openItem === item.value && (
            <div className="px-4 py-2 mx-2 bg-white">{item.content}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const Listings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const accordionItems = [
    {
      value: "year",
      label: "Year",
      content: (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Pre - 1950s</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">1950s - 1970s</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">1970s - 2000s</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Post - 2000s</span>
          </label>
        </div>
      ),
    },
    {
      value: "manufacturer",
      label: "Manufacturer",
      content: (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Bentley</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Buick</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Rolls Royce</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Land Rover</span>
          </label>
        </div>
      ),
    },
    {
      value: "transmission",
      label: "Transmission",
      content: (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Automatic</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Manual</span>
          </label>
        </div>
      ),
    },
    {
      value: "fuelType",
      label: "Fuel Type",
      content: (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Petrol</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Deisel</span>
          </label>
        </div>
      ),
    },
    {
      value: "buyingOptions",
      label: "Buying Options",
      content: (
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Auctions</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Fixed Price</span>
          </label>
        </div>
      ),
    },
  ];

  return (
    <>
    
    < Navbar />

    <div className="min-h-screen p-4 md:p-6">
      {/* Mobile Filter Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="px-4 py-2 border rounded-lg flex items-center gap-2"
        >
          Filters {isSidebarOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar */}
        <div
          className={`md:w-64 flex-shrink-0 ${
            isSidebarOpen ? "block" : "hidden"
          } md:block`}
        >
          <div className="bg-white">
            <div className="flex justify-between items-center p-4">
              <span className="text-sm">Filter By</span>
              <button className="text-sm">clear all</button>
            </div>

            <Accordion items={accordionItems} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-neutral-200 text-center py-1 px-4 rounded mb-6">
            Live Auction
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Car Card 1 */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative h-48 bg-neutral-200">
                <img
                    src={buick}
                    alt="1949 Buick Super"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <button className="absolute top-2 right-2 p-1 rounded-full bg-white">
                  <Heart size={20} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium">1949 Buick Super</h3>
                <div className="text-lg font-bold mt-1">$ 79,92,500</div>
                <div className="text-sm text-neutral-600">Inclusive 15% Margin</div>
                <div className="text-right mt-2 text-sm text-neutral-600">10 Bids</div>
              </div>
            </div>

            {/* Car Card 2 */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="relative h-48 bg-neutral-200">
                <img
                    src={RR}
                    alt="1949 Buick Super"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <button className="absolute top-2 right-2 p-1 rounded-full bg-white">
                  <Heart size={20} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium">2001 Bentley Continental Le Mans</h3>
                <div className="text-lg font-bold mt-1">$ 69,42,500</div>
                <div className="text-sm text-neutral-600">Inclusive 15% Margin</div>
                <div className="text-right mt-2 text-sm text-neutral-600">18 Bids</div>
              </div>
            </div>

            {/* Car Card 3 */}
            <div className="bg-gray-100 rounded-lg border border-gray-100 overflow-hidden">
              <div className="relative h-48 bg-neutral-200">
                <img
                    src={bently}
                    alt="1949 Buick Super"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <button className="absolute top-2 right-2 p-1 rounded-full bg-white">
                  <Heart size={20} />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-medium">Rolls Royce Silver Spirit</h3>
                <div className="text-lg font-bold mt-1">$ 200,591,500</div>
                <div className="text-sm text-neutral-600">Inclusive 15% Margin</div>
                <div className="text-right mt-2 text-sm text-neutral-600">29 Bids</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    < Footer />

    </>
  );
};

export default Listings;
