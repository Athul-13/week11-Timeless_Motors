const express = require('express');
const router = express.Router();
const { optionalProtect } = require('../middleware/authMiddleware');
const { getPopularFAQs, performSearch, getSearchSuggestions } = require('../controller/FAQController');


router.get('/popular-questions', optionalProtect, getPopularFAQs)
router.get('/suggestions/:query', optionalProtect, getSearchSuggestions);
router.get('/searchFAQ/:query', optionalProtect, performSearch);

module.exports = router;