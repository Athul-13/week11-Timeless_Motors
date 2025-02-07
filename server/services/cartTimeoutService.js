const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const Bid = require('../models/Bids');

class CartTimeoutService {
  constructor() {
    this.QUEUES = {
      CART_TIMEOUT: 'cart-timeout',
      NOTIFICATIONS: 'notifications'
    };

    this.CART_TIMEOUT = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

    this.cartTimeoutQueue = new Queue(this.QUEUES.CART_TIMEOUT, { redis: redisConfig });
    this.notificationQueue = new Queue(this.QUEUES.NOTIFICATIONS, { redis: redisConfig });

    this.setupProcessors();
  }

  setupProcessors() {
    this.cartTimeoutQueue.process(async (job) => {
      const { listingId, userId } = job.data;
      
      try {
        // Get listing first to verify it still exists and is active
        const listing = await Listing.findById(listingId);
        if (!listing || listing.status !== 'active') {
          return;
        }

        // Check if item is still in cart and unpurchased
        const cart = await Cart.findOne({ 
          user: userId,
          'items.product': listingId
        });

        if (!cart) {
          return;
        }

        // Remove from current user's cart
        await Cart.updateOne(
          { user: userId },
          { $pull: { items: { product: listingId } } }
        );

        // Process cascade to next bidder
        await this.cascadeToNextBidder(listingId);

      } catch (error) {
        console.error('Cart timeout processing error:', error);
        throw error;
      }
    });
  }

  async cascadeToNextBidder(listingId) {
    try {
        const listing = await Listing.findById(listingId);
        if (!listing || listing.status !== 'active') {
            console.log('Listing not found or not active:', listingId);
            return;
        }

        console.log('Finding bids for listing:', listingId);
        // Get all bids for this listing, sorted by amount descending
        const bids = await Bid.find({ listing_id: listingId })
            .sort({ bid_amount: -1 })
            .populate('user_id');

        console.log('Found bids:', bids.length);
        console.log('Bids',bids);

        // Find the next eligible bidder
        const nextBidder = await this.findNextEligibleBidder(bids, listing);
        console.log('Next eligible bidder:', nextBidder?.user_id);

        if (nextBidder) {
            // Update listing with new winning bidder
            console.log('Updating listing with new winner:', nextBidder.user_id);
            listing.last_bid_user_id = nextBidder.user_id;
            listing.current_bid = nextBidder.bid_amount;
            await listing.save();

            // Add to new winner's cart
            console.log('Adding to new winner cart');
            await this.addToNewWinnerCart(listing, nextBidder.user_id);

            // Schedule timeout for new winner
            console.log('Scheduling new timeout');
            await this.scheduleCartTimeout(listingId, nextBidder.user_id);

            // Send notifications
            await this.sendBidCascadeNotifications(listing, nextBidder);
        } else {
            console.log('No eligible bidders found, marking as expired');
            listing.status = 'expired';
            await listing.save();
        }
    } catch (error) {
        console.error('Bid cascade error:', error);
        throw error;
    }
}

  async findNextEligibleBidder(bids, listing) {
    if (!bids || bids.length === 0) return null;

    // Filter out the current winner and ensure bid meets minimum requirements
    const eligibleBids = bids.filter(bid => 
      bid.user_id.toString() !== listing.last_bid_user_id.toString() &&
      bid.bid_amount >= listing.starting_bid
    );

    return eligibleBids[0]; // Return highest eligible bid
  }

  async addToNewWinnerCart(listing, userId) {
    try {
        console.log('Starting addToNewWinnerCart for user:', userId);
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            console.log('Creating new cart for user:', userId);
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        // Check if item isn't already in cart
        const itemExists = cart.items.some(item => 
            item.product.toString() === listing._id.toString()
        );

        if (!itemExists) {
            console.log('Adding item to cart for user:', userId);
            cart.items.push({
                product: listing._id,
                addedAt: new Date()
            });

            await cart.save();
            console.log('Successfully saved cart for user:', userId);
        } else {
            console.log('Item already exists in cart for user:', userId);
        }
    } catch (error) {
        console.error('Error in addToNewWinnerCart:', error);
        throw error;
    }
}

  async scheduleCartTimeout(listingId, userId) {
    try {
      const jobId = `cart-timeout:${listingId}:${userId}`;
      
      // Remove any existing timeout jobs for this listing/user combination
      const existingJob = await this.cartTimeoutQueue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove();
      }

      // Schedule new timeout
      await this.cartTimeoutQueue.add(
        {
          listingId,
          userId
        },
        {
          delay: this.CART_TIMEOUT,
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          },
          removeOnComplete: true,
          removeOnFail: true
        }
      );
    } catch (error) {
      console.error('Error scheduling cart timeout:', error);
      throw error;
    }
  }

  async sendBidCascadeNotifications(listing, nextBidder) {
    const notifications = [
      {
        userId: listing.last_bid_user_id,
        type: 'cart_timeout',
        message: `Your cart reservation for "${listing.make} ${listing.model}" has expired`
      },
      {
        userId: nextBidder.user_id,
        type: 'auction_cascaded',
        message: `Good news! The auction for "${listing.make} ${listing.model}" has cascaded to you. You have 48 hours to complete the purchase.`
      }
    ];

    try {
      await Promise.all(
        notifications.map(notification => 
          this.notificationQueue.add(notification, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            }
          })
        )
      );
    } catch (error) {
      console.error('Error sending cascade notifications:', error);
      throw error;
    }
  }

  async handleCartRemoval(listingId, userId) {
    try {
      // Cancel any existing timeout job
      const jobId = `cart-timeout:${listingId}:${userId}`;
      const existingJob = await this.cartTimeoutQueue.getJob(jobId);
      if (existingJob) {
        await existingJob.remove();
      }

      // Cascade to next bidder immediately
      await this.cascadeToNextBidder(listingId);
    } catch (error) {
      console.error('Error handling cart removal:', error);
      throw error;
    }
  }
}

module.exports = new CartTimeoutService();