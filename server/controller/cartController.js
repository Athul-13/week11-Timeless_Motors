const Cart = require("../models/Cart");
const User = require("../models/User");
const Listing = require("../models/Listing");
const cartTimeoutService = require('../services/cartTimeoutService');

exports.getCart = async (req, res) => {
    try {
        const userId = req.params.userId;

        const userExists = await User.findById(userId);

        if(!userExists) {
            return res.statu(404).json({message: "User not found"})
        }

        const cart = await Cart.find({user: userId}).populate('items.product');
         
        if(!cart || cart.length === 0) {
            return res.status(200).json({message: "No items in the cart"});
        }

        res.status(200).json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to fetch cart"});
    }
}

exports.addItemToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const {item: listingId} = req.body;

        const listing = await Listing.findById(listingId);
        if(!listing) {
            return res.status(404).json({message: "Listing not found"});
        }

        let cart = await Cart.findOne({user: userId});

        if(!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: listingId}]
            });
            await cart.save();
        } else {
            const itemExists = cart.items.some(item => item.product.toString() === listingId);
            if(itemExists) {
                return res.status(400).json({message: 'Item already in cart'});
            }

            cart.items.push({product: listingId});
            await cart.save();
        }

        res.status(200).json({
            message: 'Item added to cart',
            cart
        });

    } catch (err) {
        console.error('Error while adding to cart', err);
        res.status(500).json({message: 'Failed to add item to cart'})
    }
}

exports.removeCartItem = async (req, res) => {
    try {
        const userId = req.user._id;
        const listingId = req.params.listingId;

        console.log(`Removing item from cart. User: ${userId}, Listing: ${listingId}`);

        // Check if listing exists and get its type
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        console.log(`Listing found: ${listing.title}, Type: ${listing.type}, Status: ${listing.status}`);

        // Find user's cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // If it's an auction item, handle the cascade first
        if (listing.type === 'Auction' && listing.status === 'expired') {
            console.log('Auction item detected. Processing cascade...');
            try {
                await cartTimeoutService.handleCartRemoval(listingId, userId);
                
                // Refresh cart after cascade
                cart = await Cart.findOne({ user: userId });

                console.log('Auction item removed and cascade completed.');
                
                return res.status(200).json({
                    message: 'Auction item removed and cascaded to next bidder',
                    cart
                });
            } catch (cascadeError) {
                console.error('Error in bid cascade:', cascadeError);
                return res.status(500).json({
                    message: 'Error processing auction cascade',
                    error: cascadeError.message
                });
            }
        }

        // Remove item from cart after cascade is handled
        cart.items = cart.items.filter(item =>
            item.product.toString() !== listingId
        );

        await cart.save();

        res.status(200).json({
            message: 'Item removed from cart',
            cart
        });

    } catch (err) {
        console.error('Error removing item:', err);
        res.status(500).json({ message: 'Failed to remove item from cart' });
    }
}

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({user: userId});
        if(!cart) {
            return res.status(404).json({message: 'Cart not found'});
        }

        cart.items = [];
        cart.save();
    } catch (err) {
        console.error('Error clearing cart', err);
        res.status(500).json({message: 'failed to clear the cart'})
    }
}