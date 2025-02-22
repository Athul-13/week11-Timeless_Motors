import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FAQService } from '../utils/api';
import banner_faq from '../assets/banner_faq.jpg';

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [popularQuestions, setPopularQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const suggestionsRef = useRef(null);
  
  // Fetch popular questions on component mount
  useEffect(() => {
    fetchPopularQuestions();
  }, []);

  // Fetch popular questions
  const fetchPopularQuestions = async () => {
    try {
      setIsLoading(true);
      const data = await FAQService.getPopularFAQS();
      setPopularQuestions(data);
    } catch (error) {
      console.error('Error fetching popular questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      const results = await FAQService.suggestions(query);
      console.log("Search Suggestions API Response:", results);
      setFilteredQuestions(results);
      setShowSuggestions(true);
    } else {
      setFilteredQuestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search button click
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const results = await FAQService.searchFAQs(searchQuery);
      setFilteredQuestions(results);
      setSelectedQuestion(null);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (faq) => {
    console.log('click', faq);
    setSelectedQuestion(faq);
    setSearchQuery(faq.question);
    setShowSuggestions(false);
    setExpandedQuestion(faq.id);
  };

  // Toggle question expansion
  const toggleQuestion = (id) => {
    setExpandedQuestion(prevExpandedQuestion => 
      prevExpandedQuestion === id ? null : id
    );
  };

  // Questions to display
  const displayQuestions = selectedQuestion 
    ? [selectedQuestion]
    : filteredQuestions.length > 0 
      ? filteredQuestions 
      : popularQuestions;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <Navbar />
      
      <div className="bg-white px-8 md:px-16 py-4 md:py-8">
          <div className="relative mb-8">
                  <img
                    src={banner_faq} // Replace with your image source
                    alt="Vintage Car"
                    className="w-full h-80 md:h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <h1 className="text-white text-4xl md:text-6xl font-bold">FREQUENTLY ASKED QUESTIONS</h1>
                  </div>
                </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8 relative" ref={suggestionsRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Type your question here"
                className="w-full py-3 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-0 top-0 h-full bg-gray-800 text-white px-6 rounded-r-md hover:bg-gray-900 transition"
              >
                SEARCH
              </button>
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && searchQuery && filteredQuestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                {filteredQuestions.map(faq => (
                  <div
                    key={faq._id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionClick(faq)}
                  >
                    {faq.question}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section title */}
          <h2 className="text-xl font-semibold mb-4">
            {searchQuery ? 'Search Results' : 'Popular Questions'}
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {displayQuestions.map(faq => (
                <div key={faq._id} className="border-t border-gray-200 py-4">
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleQuestion(faq._id)}
                  >
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 mr-4 flex-shrink-0">
                        Q
                      </div>
                      <h3 className="text-gray-800 font-medium">{faq.question}</h3>
                    </div>
                    <button 
                      type="button"
                      className="ml-4 text-gray-500 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleQuestion(faq._id);
                      }}
                    >
                      {expandedQuestion === faq._id ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {expandedQuestion === faq._id && (
                    <div className="mt-4 ml-12 text-gray-700">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Show link only if a search was performed */}
          {searchQuery && (
            <div className="mt-4 text-center">
              <a 
                href="/contact-support"
                className="text-blue-600 hover:underline font-semibold"
              >
                Still have questions? Contact our support team.
              </a>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQPage;