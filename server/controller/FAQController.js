const FAQ = require('../models/FAQ');
const Fuse = require('fuse.js')

const fuseOptions = {
  keys: ['question', 'answer'],
  includeScore: true,
  threshold: 0.3,
  minMatchCharLength: 2
};

exports.getPopularFAQs = async (req, res) => {
    try {
      const faqs = await FAQ.aggregate([
        { $sample: { size: 5 } } 
      ]);
  
      if (!faqs.length) {
        return res.status(404).json({ message: 'No FAQs found' });
      }
  
      res.status(200).json(faqs);
    } catch (error) {
      console.error('Error fetching random FAQs:', error);
      res.status(500).json({ message: 'Server error while fetching random FAQs' });
    }
  } 

exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.params;

    // If query is empty or too short, return empty results
    if (!query || query.length < 2) {
      return res.status(200).json([]);
    }

    // Get all FAQs from database
    const faqs = await FAQ.find({}, { question: 1, answer: 1 });

    // Initialize Fuse with more lenient options for suggestions
    const fuse = new Fuse(faqs, {
      ...fuseOptions,
      threshold: 0.5
    });

    // Perform the fuzzy search
    const searchResults = fuse.search(query);

    // Format results to only include necessary data
    const suggestions = searchResults.slice(0, 5).map(result => ({
      _id: result.item._id,
      question: result.item.question,
      answer: result.item.answer,
      score: result.score
    }));

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({ 
      message: 'Server error while getting search suggestions'
    });
  }
};

// Controller for full search when search button is pressed
exports.performSearch = async (req, res) => {
  try {
    const { query } = req.params;

    if (!query) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    // Get all FAQs from database
    const faqs = await FAQ.find({});

    // Initialize Fuse with stricter options for full search
    const fuse = new Fuse(faqs, {
      ...fuseOptions,
      threshold: 0.1,
    });

    // Perform the fuzzy search
    const searchResults = fuse.search(query);

    // If no results found
    if (searchResults.length === 0) {
      return res.status(200).json({
        results: [],
        message: 'No matching FAQs found'
      });
    }

    // Format full results with more details
    const formattedResults = searchResults.slice(0, 5).map(result => ({
      _id: result.item._id,
      question: result.item.question,
      answer: result.item.answer,
      score: result.score,
      createdAt: result.item.createdAt,
      updatedAt: result.item.updatedAt
    }));

    res.status(200).json({
      results: formattedResults,
      totalResults: formattedResults.length
    });
  } catch (error) {
    console.error('Error performing FAQ search:', error);
    res.status(500).json({ 
      message: 'Server error while performing search'
    });
  }
};