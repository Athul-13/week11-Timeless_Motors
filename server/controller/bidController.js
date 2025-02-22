const Bid = require('../models/Bids');
const Listing = require('../models/Listing');
const NotificationService = require('../services/notificationServices');
const logActivity = require('../utils/logActivity');

exports.placeBid = async (req, res) => {
    try {
        const user = req.user;
        const { amount } = req.body;
        const { listingId } = req.params;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Basic validations
        if (listing.seller_id.toString() === user._id.toString()) {
            return res.status(400).json({ message: 'Sellers cannot bid on their own listings' });
        }

        const now = new Date();
        if (now > new Date(listing.end_date)) {
            return res.status(400).json({ message: 'Auction has ended' });
        }

        // Calculate minimum bid
        const minBid = (listing.current_bid > 0 ? listing.current_bid : listing.starting_bid) + listing.minimum_increment;
        if (amount < minBid) {
            return res.status(400).json({ message: `Bid must be at least ₹${minBid}` });
        }

        // Get the previous highest bidder (if any)
        const previousHighestBidder = listing.last_bid_user_id;

        // Create new bid
        const bid = new Bid({
            listing_id: listingId,
            user_id: user._id,
            bid_amount: amount
        });
        await bid.save();

        listing.current_bid = amount;
        listing.last_bid_user_id = user._id;
        listing.bid_count = (listing.bid_count || 0) + 1;
        await listing.save();

        const details = `User placed a bid of ₹${amount} on ${listing.make} ${listing.model} (${listing.year})`;
        await logActivity(req.user._id, "Bid Placed", details, req);

        // Send notification to the previous highest bidder
        if (previousHighestBidder && previousHighestBidder.toString() !== user._id.toString()) {
            await NotificationService.sendNotification(previousHighestBidder, 'overbid', {
                listingId: listingId,
                title: 'You have been outbid!',
                description: `Your bid on ${listing.make} ${listing.model} (${listing.year}) has been surpassed by another bidder.`,
                newBidAmount: amount
            });
        }

        return res.status(201).json({
            message: 'Bid placed successfully',
            currentBid: amount
        });

    } catch (error) {
        console.error('Error placing bid:', error);
        return res.status(500).json({ message: 'Failed to place bid' });
    }
};

exports.getBidsByListing = async (req, res) => {
    try {
      const bids = await Bid.find({ listing_id: req.params.listingId })
        .populate('user_id', 'first_name last_name')
        .sort('-createdAt');
  
      res.status(200).json({
        success: true,
        data: bids
      });
    } catch (error) {
      console.error('Error getting bid history',error)
      return res.status(500).json({ message: 'Failed to fetch bid history' });
    }
  };

  exports.getBidsByUser = async (req, res) => {
    try {
        const userId = req.user._id; 
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const userBids = await Bid.find({ user_id: userId })
            .populate({
                path: 'listing_id',
                select: 'make model year current_bid images status fuel_type transmission_type body_type cc_capacity',
                match: { is_deleted: false } 
            })
            .sort({ bid_date: -1 })
            .skip(skip)
            .limit(limit);

            const totalCount = await Bid.countDocuments({ user_id: userId });
            const totalPages = Math.ceil(totalCount / limit);

        const validBids = userBids.filter(bid => bid.listing_id !== null);

        const formattedBids = validBids.map(bid => ({
            bid_id: bid._id,
            bid_amount: bid.bid_amount,
            bid_date: bid.bid_date,
            listing: {
                id: bid.listing_id._id,
                make: bid.listing_id.make,
                model: bid.listing_id.model,
                year: bid.listing_id.year,
                current_bid: bid.listing_id.current_bid,
                description: bid.listing_id.description,
                status: bid.listing_id.status,
                images: bid.listing_id.images[0]?.url || null
            },
            is_winning: bid.listing_id.current_bid === bid.bid_amount
        }));

        return res.status(200).json({
            success: true,
            count: formattedBids.length,
            data: {
                formattedBids,
                totalCount,
                totalPages,
                currentPage: page
            }
        });

    } catch (error) {
        console.error('Error in getBidsByUser:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving user bids',
            error: error.message
        });
    }
};