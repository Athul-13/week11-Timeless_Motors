const Listing = require('../models/Listing');

exports.addListing = async (req, res) => {
    try {
        const user = req.user;

        if(!user) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        if(user.status !== 'verified') {
            return res.status(401).json({message: 'user not verified to sell.'});
        }

        const {
            description,
            make,
            model,
            year,
            fuel_type,
            transmission_type,
            body_type,
            cc_capacity,
            contact_number,
            starting_bid,
            minimum_increment,
            type,
            start_date,
            end_date,
            images,
        } = req.body;

        const requiredFields = {
            description,
            make,
            model,
            year,
            fuel_type,
            transmission_type,
            body_type,
            cc_capacity,
            contact_number,
            starting_bid,
            minimum_increment,
            type,
            start_date,
            end_date,
            images
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: 'Missing required fields', 
                fields: missingFields 
            });
        };

        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                message: 'At least one image is required'
            });
        };

        const newListing = new Listing({
            ...req.body,
            seller_id: user.id
        });

        await newListing.save();

        return res.status(201).json({
            success: true,
            message: 'new listing created !'
        });
    } catch (error) {
        console.error('Error adding listing:', error.message);
        res.status(500).json({ message: 'Server error. Could not add listing.' });
    }
};

exports.getAllListings = async (req, res) => {
    try {
        const listings = await Listing.find({is_deleted:false});
        res.status(201).json(listings);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.getListingById = async (req, res) => {
    try {
        const { id } = req.params;
    
        const listing = await Listing.findById(id);
    
        if (!listing) {
          return res.status(404).json({
            success: false,
            message: 'Listing not found'
          });
        }
    
        return res.status(200).json({
          success: true,
          data: listing
        });
    
      } catch (error) {
        if (error.name === 'CastError') {
          return res.status(400).json({
            success: false,
            message: 'Invalid listing ID format'
          });
        }
    
        console.error('Error in getListingById:', error);
        return res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
};