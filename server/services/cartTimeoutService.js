const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const Bid = require('../models/Bids');
const NotificationService = require('./notificationServices');

class CartTimeoutService {
  constructor() {
    this.QUEUES = {
      CART_TIMEOUT: 'cart-timeout',
      NOTIFICATIONS: 'notifications'
    };

    this.CART_TIMEOUT = 48 * 60 * 60 * 1000;  // 48 hours in milliseconds

    this.cartTimeoutQueue = new Queue(this.QUEUES.CART_TIMEOUT, { redis: redisConfig });

    this.setupProcessors();
  }

  setupProcessors() {
    this.cartTimeoutQueue.process(async (job) => {
      const { listingId, userId } = job.data;
      
      try {
        // Get listing first to verify it still exists and is active
        const listing = await Listing.findById(listingId);
        if (!listing ) {
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

        if(listing.status !== 'expired'){
          await Listing.updateOne(
            { _id: listingId }, 
            { $set: { status: 'expired' } } 
          );
        }
        

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
      console.log(`Processing listing: ${listingId}`);

      const listing = await Listing.findById(listingId);
      console.log('listing',listing);
      if (!listing) {
        return;
      }

      // Get all bids for this listing, sorted by amount descending
      const bids = await Bid.find({ listing_id: listingId })
        .sort({ bid_amount: -1 })
        .populate('user_id');

      // Find the next eligible bidder
      const nextBidder = await this.findNextEligibleBidder(bids, listing);

      if (nextBidder) {
        // Update listing with new winning bidder
        listing.last_bid_user_id = nextBidder.user_id;
        listing.current_bid = nextBidder.bid_amount;
        await listing.save();

        // Add to new winner's cart
        await this.addToNewWinnerCart(listing, nextBidder.user_id);

        // Schedule timeout for new winner
        await this.scheduleCartTimeout(listingId, nextBidder.user_id);

        // Send notifications
        await NotificationService.sendBidCascadeNotifications(listing, nextBidder);
      } else {
        // No eligible bidders left, mark listing as expired
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

    // Get the current winning bid amount
    const currentWinningBid = bids.find(bid => 
      bid.user_id._id.toString() === listing.last_bid_user_id.toString()
    );

    if (!currentWinningBid) return null;

    // Find the highest bid from a different user that's less than or equal to the current winning bid
    const nextBidder = bids.find(bid => 
      bid.user_id._id.toString() !== listing.last_bid_user_id.toString() &&
      bid.bid_amount <= currentWinningBid.bid_amount
    );

    return nextBidder || null;
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
      console.log(`Scheduling timeout for listing ${listingId}, user ${userId}`);
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
      console.log(`Scheduled new timeout job ${jobId} with delay ${this.CART_TIMEOUT}ms`);
    } catch (error) {
      console.error('Error scheduling cart timeout:', error);
      throw error;
    }
  }

  // async sendBidCascadeNotifications(listing, nextBidder) {
  //   try {
  //       if (!nextBidder) {
  //           console.warn('⚠️ No next bidder found. Skipping cascade notification.');
  //           return;
  //       }

  //       console.log('📢 Sending bid cascade notifications:', listing, nextBidder);

  //       // Notify previous bidder (cart timeout)
  //       if (listing.last_bid_user_id) {
  //           await this.sendNotification(listing.last_bid_user_id, 'cart_timeout', {
  //               listingId: listing._id,
  //               title: 'Cart Timeout',
  //               description: `Your cart reservation for "${listing.make} ${listing.model}" has expired`
  //           });
  //       }

  //       // Notify next bidder (auction cascaded)
  //       await this.sendNotification(nextBidder.user_id, 'auction_cascaded', {
  //           listingId: listing._id,
  //           title: 'Auction Cascaded',
  //           description: `Good news! The auction for "${listing.make} ${listing.model}" has cascaded to you. You have 48 hours to complete the purchase.`,
  //           bidAmount: nextBidder.bid_amount
  //       });

  //       console.log('✅ Bid cascade notifications sent successfully');
  //   } catch (error) {
  //       console.error('❌ Error in bid cascade notifications:', error);
  //       throw error;
  //   }
  // }

  async handleCartRemoval(listingId, userId) {
    try {
      console.log(`Handling cart removal for Listing ID: ${listingId}, User ID: ${userId}`);
      // First, verify the listing and user
      const listing = await Listing.findById( listingId );
      console.log('listing',listing);
      if (!listing) {
        console.error('Listing not found or not active');
        throw new Error('Listing not found or not active');
      }
      console.log('Listing verified:', listing);

      // Cancel any existing timeout job
      const jobId = `cart-timeout:${listingId}:${userId}`;
      const existingJob = await this.cartTimeoutQueue.getJob(jobId);
      if (existingJob) {
        console.log('Found existing job, removing it:', jobId);
        await existingJob.remove();
      }

       // Remove from cart
       console.log('Removing item from user cart');
       const updateResult = await Cart.updateOne(
         { user: userId },
         { $pull: { items: { product: listingId } } }
       );
       console.log('Cart update result:', updateResult);

      // Then cascade to next bidder
      await this.handleManualRemovalNotifications(listingId);
    } catch (error) {
      console.error('Error handling cart removal:', error);
      throw error;
    }
  }

  async handleManualRemovalNotifications(listing) {
    try {
        // Get all bids and find next eligible bidder
        const bids = await Bid.find({ listing_id: listing._id })
            .sort({ bid_amount: -1 })
            .populate('user_id');
        
        const nextBidder = await this.findNextEligibleBidder(bids, listing);
        
        if (nextBidder) {
            // Only notify the next bidder (no notification to previous user)
            await NotificationService.sendNotification(nextBidder.user_id, 'bid_won', {
                listingId: listing._id,
                title: 'Auction Cascaded',
                description: `Good news! The auction for ${listing.make} ${listing.model} has cascaded to you. You have 48 hours to complete the purchase.`,
                bidAmount: nextBidder.bid_amount
            });
        }
    } catch (error) {
        console.error('Error in manual removal notifications:', error);
        throw error;
    }
  }
}

module.exports = new CartTimeoutService();