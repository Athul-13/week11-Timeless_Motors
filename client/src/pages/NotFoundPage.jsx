import { ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center max-w-lg">
        {/* Error Code */}
        <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        
        {/* Error Animation */}
        <div className="relative mt-4 mb-8">
          <div className="h-1 w-24 bg-indigo-200 mx-auto rounded-full"></div>
          <div className="absolute w-6 h-6 bg-white border-4 border-indigo-600 rounded-full -top-3 left-1/2 transform -translate-x-1/2 animate-bounce"></div>
        </div>
        
        {/* Error Message */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={goBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <a 
            href="/"
            className="flex items-center justify-center px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Return Home
          </a>
        </div>
      </div>
      
      {/* Abstract Decoration */}
      <div className="absolute -z-10 opacity-10">
        <div className="h-64 w-64 rounded-full bg-indigo-600 blur-3xl"></div>
      </div>
    </div>
  );
};

export default NotFoundPage;