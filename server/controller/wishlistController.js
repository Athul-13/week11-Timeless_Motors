const Wishlist = require('../models/Wishlist');
const User = require('../models/User');
const Listing = require('../models/Listing');

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.params.userId;

        const userExists = await User.findById(userId);
        if(!userExists) {
            return res.status(404).json({message: 'User not found'});
        }

        const wishlist = await Wishlist.find({user : userId}).populate('items.product');

        if (!wishlist || wishlist.length === 0) {
            return res.status(200).json({ message: 'No items in the wishlist' });
        }

        res.status(200).json(wishlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
}

exports.addItemToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { item: listingId } = req.body;

        // Check if listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check if the user already has a wishlist
        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            // If the user doesn't have a wishlist, create one
            wishlist = new Wishlist({
                user: userId,
                items: [{ product: listingId }],
            });
            await wishlist.save();
        } else {
            // If wishlist exists, check if the item is already added
            const itemExists = wishlist.items.some(item => item.product.toString() === listingId);
            if (itemExists) {
                return res.status(400).json({ error: 'Item already in wishlist' });
            }

            // Add the item to the existing wishlist
            wishlist.items.push({ product: listingId });
            await wishlist.save();
        }

        res.status(201).json({
            message: 'Item added to wishlist',
            wishlist,
        });
    } catch (error) {
        console.error('Error adding item to wishlist:', error);
        res.status(500).json({ error: 'Failed to add item to wishlist' });
    }
};

exports.removeWishlistItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const listingId = req.params.listingId;

        // Check if listing exists
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check if the user already has a wishlist
        let wishlist = await Wishlist.findOne({ user: userId });
        if(!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        // Remove the specific item from wishlist
        wishlist.items = wishlist.items.filter(item => 
            item.product.toString() !== listingId
        );

        await wishlist.save();

        res.status(200).json({
            message: 'Item removed from wishlist',
            wishlist
        });
    } catch (err) {
        console.error('Error removing item',err)
        res.status(500).json({ error: 'Failed to remove item from wishlist' });
    }
}