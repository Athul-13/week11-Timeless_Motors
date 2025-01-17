import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import homeBanner from '../assets/home-banner.jpg';
import bently from '../assets/bently-front.webp';
import buick from '../assets/buick-side.jpeg';
import RR from '../assets/RR-front.jpg';

const LandingPage = () => {

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
                <div className="text-lg font-semibold">$ 76,925.00</div>
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
            <a href="#" className="text-blue-600 hover:text-blue-700">
                See All
            </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Auction Car 1 */}
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
                <div className="text-lg font-semibold">$ 76,925.00</div>
                <div className="text-sm text-gray-600">10 Bids</div>
                </div>
                <div className="text-sm text-gray-600">
                <div>ends in 16:45:34</div>
                <div>Inclusive 15% Margin</div>
                </div>
            </div>

            {/* Live Auction Car 2 */}
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
                <div>ends in 20:40:34</div>
                <div>Inclusive 15% Margin</div>
                </div>
            </div>

            {/* Live Auction Car 3 */}
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
                <div>ends in 12:45:34</div>
                <div>Inclusive 15% Margin</div>
                </div>
            </div>
            </div>
        </div>
        </div>
        
        < Footer />
        </>
        );
}

export default LandingPage;