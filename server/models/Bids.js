const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    listing_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bid_amount: {
        type: Number,
        required: true
    },
    bid_date: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

module.exports = mongoose.model('Bids', bidSchema);
