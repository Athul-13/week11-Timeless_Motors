const Listing = require('../models/Listing');
const logActivity = require('../utils/logActivity');

const VALID_STATUSES = ['active', 'sold', 'pending start'];

exports.addListing = async (req, res) => {
    try {
        const user = req.user;
        console.log('req', req.body);

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
            type,
            images,
            // Optional fields for auction
            minimum_increment,
            start_date,
            end_date,
        } = req.body;

        // Base required fields for all listing types
        const baseRequiredFields = {
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
            type,
            images
        };

        // Check base required fields
        const missingBaseFields = Object.entries(baseRequiredFields)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingBaseFields.length > 0) {
            return res.status(400).json({ 
                message: 'Missing required fields', 
                fields: missingBaseFields 
            });
        }

        // Additional validation for auction type
        if (type === 'Auction') {
            const auctionFields = { minimum_increment, start_date, end_date };
            const missingAuctionFields = Object.entries(auctionFields)
                .filter(([_, value]) => !value)
                .map(([key]) => key);

            if (missingAuctionFields.length > 0) {
                return res.status(400).json({ 
                    message: 'Missing required auction fields', 
                    fields: missingAuctionFields 
                });
            }
        }

        // Create listing data object
        const listingData = {
            ...baseRequiredFields,
            seller_id: user.id
        };

        // Add auction-specific fields only if type is auction
        if (type === 'Auction') {
          listingData.minimum_increment = minimum_increment;
          listingData.start_date = new Date(start_date).toISOString(); 
          listingData.end_date = new Date(end_date).toISOString(); 
      }
      
        const newListing = new Listing(listingData);
        await newListing.save();

        const details = `User added a new listing: ${make} ${model} (${year}), Type: ${type}`;
        await logActivity(user.id, "New Listing Added", details, req);

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
      const listings = await Listing.find()
        .populate('seller_id', 'first_name last_name email')
        .populate('approved_by', 'first_name last_name')
        .sort({ createdAt: -1 });
  
      res.json(listings);
    } catch (error) {
      console.error('Error in getAllListings:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching listings',
        error: error.message 
      });
    }
};

exports.getListingById = async (req, res) => {
    try {
        const { id } = req.params;
    
        const listing = await Listing.findById(id).populate('seller_id', 'first_name last_name');
    
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

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user has permission to update this listing
    const isSeller = listing.seller_id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this listing' }); // Deny access
    }

    // Update the listing
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    const details = `User updated listing: ${listing.make} ${listing.model} (${listing.year})`;
    await logActivity(req.user._id, "Listing Updated", details, req);

    res.status(200).json(updatedListing);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error updating listing:', error);
    res.status(500).json({ message: 'Error updating listing' });
  }
};

exports.updateApprovalStatus = async (req, res) => {
  try {
    const {listingId} = req.params;
    const {status} = req.body;

    const listing = await Listing.findById(listingId);
    if(!listing) {
      return res.status(404).json({message: "Listing not found"});
    }

    listing.approval_status = status.toLowerCase();

    await listing.save();

    return res.status(200).json({message: "Status updated successfully"})

  } catch(err) {
    console.error('Error in updating status:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating lising status"
    })
  }
};

exports.updateListingStatus = async (req, res) => {
  try {
    const {listingId} = req.params;
    const {status} = req.body;

    if(!status || !VALID_STATUSES.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Status must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const listing = await Listing.findById(listingId);

    if(!listing) {
      return res.status(404).json({message: "Listing not found"});
    }

    if (listing.status === status) {
      return res.status(200).json({
          success: true,
          message: "Listing status is already " + status,
          listing
      });
    }

    listing.status = status.toLowerCase();

    await listing.save();

    return res.status(200).json({message: "Status updated successfully"})
  } catch(err) {
    console.error('Error in updating status:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating lising status"
    })
  }
}

exports.getListingsByUser = async (req, res) => {
  try {
      const userId = req.user._id;

      const listings = await Listing.find({ seller_id: userId, is_deleted: false })
          .sort({ createdAt: -1 }) 

      return res.status(200).json({
          success: true,
          count: listings.length,
          data: listings
      });

  } catch (error) {
      console.error('Error in getListingsByUser:', error);
      return res.status(500).json({
          success: false,
          message: 'Error retrieving user listings',
          error: error.message
      });
  }
};
