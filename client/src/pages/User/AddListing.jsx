import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scroll, AlertCircle, DollarSign, Clock, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const AddListing = () => {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const terms = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-gray-600" />,
      title: "Eligibility",
      content: "To list an item for auction on Timeless Motors, users must first complete the KYC (Know Your Customer) verification process. This ensures that the seller is a legitimate and verified user of our platform."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-gray-600" />,
      title: "Listing Fee",
      content: "A standard listing fee of ₹15,000 (Rupees Fifteen Thousand) is required to auction an item on Timeless Motors. This fee is non-refundable and must be paid at the time of listing the item."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-gray-600" />,
      title: "Commission",
      content: "Timeless Motors charges a 15% commission on the final sale price of the item. This commission will be deducted from the final amount paid by the winning bidder."
    },
    {
      icon: <Clock className="w-6 h-6 text-gray-600" />,
      title: "Auction Time Period",
      content: "The auction for each item will last for a standard period of 2 business days. The auction will end once this period has passed, and the highest bid at that time will be considered the winning bid."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        < Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-6">
            <Scroll className="w-8 h-8 text-gray-600" />
            <h1 className="text-xl font-bold text-gray-800">Terms and Conditions for Auctioning an Item</h1>
          </div>

          {/* Alert Banner */}
          <div className="flex items-center space-x-2 p-4 mb-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Please read these terms carefully before proceeding with your listing</p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-6">
            {terms.map((term, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 hover:border-gray-300">
                <div className="flex items-center space-x-3 mb-2">
                  {term.icon}
                  <h2 className="text-lg font-semibold text-gray-800">{index + 1}. {term.title}</h2>
                </div>
                <p className="text-gray-600 ml-9">{term.content}</p>
              </div>
            ))}

            {/* Additional Terms */}
            <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 hover:border-gray-300">
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-6 h-6 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">5. Additional Terms</h2>
              </div>
              <div className="text-gray-600 ml-9 space-y-2">
                <p>• Payment and Processing: Processed within 2 business days after auction conclusion.</p>
                <p>• Refunds and Cancellations: No cancellations or refunds after listing submission.</p>
                <p>• Listing Restrictions: Platform reserves right to reject non-compliant items.</p>
                <p>• General Terms: Terms subject to modification with immediate effect upon posting.</p>
              </div>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500 cursor-pointer"
              />
              <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                I agree to the Terms and Conditions.
              </span>
            </label>

            <button
              onClick={() => navigate('/addlisting/new')}
              disabled={!isChecked}
              className={`mt-6 w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-200 ${
                isChecked 
                  ? 'bg-gray-800 hover:bg-gray-900 active:bg-gray-950 transform active:scale-[0.98]' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Add Listing
            </button>
          </div>
        </div>
      </div>
      < Footer />
    </div>
  );
};

export default AddListing;