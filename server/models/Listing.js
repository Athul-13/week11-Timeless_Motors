const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    description: { 
        type: String, 
        required: true 
    },
    make: { 
        type: String, 
        required: true
    },
    model: { 
        type: String, 
        required: true 
    },
    year: { 
        type: Number, 
        required: true 
    },
    fuel_type: { 
        type: String, 
        required: true 
    },
    transmission_type: { 
        type: String, 
        required: true 
    },
    body_type: { 
        type: String, 
        required: true 
    },
    cc_capacity: { 
        type: Number, 
        required: true 
    },
    seller_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    contact_number: { 
        type: String, 
        required: true 
    },
    starting_bid: { 
        type: Number, 
        required: true 
    },
    current_bid: { 
        type: Number, 
        default: 0 
    },
    minimum_increment: { 
        type: Number,
        required: function() { return this.type === 'Auction'; }
    },
    type: { 
        type: String,
        enum: ['Auction', 'Fixed price'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['active', 'sold', 'pending start'], 
        default: 'active' 
    },
    bid_count: { 
        type: Number, 
        default: 0 
    },
    last_bid_user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    start_date: { 
        type: Date,
        required: function() { return this.type === 'Auction'; } 
    },
    end_date: { 
        type: Date,
        required: function() { return this.type === 'Auction'; }
    },
    images: [
        {
            url: { type: String, required: true },
            public_id: { type: String, required: true },
          },
    ],
    is_deleted: { 
        type: Boolean, 
        default: false 
    },
    approved_by: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        default: null 
    },
    approval_status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'approved' 
    },
    approval_date: { 
        type: Date, 
        default: null 
    },
  }, {timestamps: true}
);

module.exports = mongoose.model('Listing', listingSchema);