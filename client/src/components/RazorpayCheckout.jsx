import { CreditCard } from 'lucide-react';

const RazorpayCheckout = ({ onSelect }) => {
  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelect = () => {
    onSelect({
      type: 'razorpay',
      label: 'Razorpay',
      icon: CreditCard,
      handler: initializeRazorpay
    });
  };

  return (
    <button
      onClick={handleSelect}
      className="w-full flex items-center gap-3 p-3 border rounded-lg hover:border-indigo-600 transition-colors"
    >
      <CreditCard className="w-5 h-5 text-gray-500" />
      <div className="flex-1 text-left">
        <div className="font-medium text-gray-800">Pay Online (Razorpay)</div>
        <div className="text-sm text-gray-500">Pay securely with Razorpay</div>
      </div>
    </button>
  );
};

export default RazorpayCheckout;