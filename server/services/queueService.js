const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const User = require('../models/User');

class QueueService {
  constructor() {
    // Define queue names as constants
    this.QUEUES = {
      AUCTION_END: 'auction-end',
      NOTIFICATIONS: 'notifications'
    };

    // Queue configurations
    this.QUEUE_CONFIG = {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: true
      }
    };

    // Initialize queues
    this.auctionEndQueue = new Queue(this.QUEUES.AUCTION_END, { redis: redisConfig });
    this.notificationQueue = new Queue(this.QUEUES.NOTIFICATIONS, { redis: redisConfig });

    // Initialize queue handlers
    this.initializeQueueHandlers();
    this.setupProcessors();
    this.setupQueueEvents();
    this.startAuctionMonitoring();
  }

  initializeQueueHandlers() {
    // Set up error handlers for all queues
    [this.auctionEndQueue, this.notificationQueue].forEach(queue => {
      queue.on('error', error => {
        console.error(`Queue Error (${queue.name}):`, error);
      });

      queue.on('failed', (job, error) => {
        console.error(`Job Failed (${queue.name}, Job ID: ${job.id}):`, error);
      });

      // Add monitoring for stalled jobs
      queue.on('stalled', (jobId) => {
        console.warn(`Job stalled (${queue.name}, Job ID: ${jobId})`);
      });
    });
  }

  setupProcessors() {
    // Auction End Job Processor
    this.auctionEndQueue.process(async (job) => {
      const { listingId } = job.data;
  
      try {
        // Find the listing
        const listing = await Listing.findById(listingId)
          .populate('seller_id')
          .populate('last_bid_user_id');
  
        if (!listing) {
          throw new Error(`Listing not found: ${listingId}`);
        }
  
        // Validate auction end conditions
        if (listing.status !== 'active' || new Date() < listing.end_date) {
          throw new Error(`Auction for listing ${listingId} not ready to be processed`);
        }
  
        // Process winning bid
        if (listing.last_bid_user_id) {
          // Add to winner's cart
          await this.addToWinnerCart(listing);
  
          // Send notifications
          await this.sendAuctionEndNotifications(listing);
        }
  
        return { 
          success: true, 
          message: `Auction ended for listing ${listingId}` 
        };
      } catch (error) {
        console.error('Auction end processing error:', error);
        throw error;
      }
    });
  }

  startAuctionMonitoring() {
    // Check for ending auctions every minute
    this.auctionCheckInterval = setInterval(async () => {
      try {
        const nearEndAuctions = await Listing.find({
          type: 'Auction',
          status: 'active',
          end_date: {
            $lte: new Date(Date.now() + 60000), // Next minute
            $gt: new Date() // Not ended yet
          }
        });

        for (const auction of nearEndAuctions) {
          const delay = auction.end_date.getTime() - Date.now();
          await this.scheduleAuctionEnd(auction);
          console.log(`Scheduled end for auction ${auction._id} in ${delay}ms`);
        }
      } catch (error) {
        console.error('Error in auction monitoring:', error);
      }
    }, 60000); // Run every minute
  }

  async addToWinnerCart(listing) {
    try {
      let cart = await Cart.findOne({ user: listing.last_bid_user_id });
  
      if (!cart) {
        cart = new Cart({
          user: listing.last_bid_user_id,
          items: []
        });
      }
  
      // Check if the listing is already in the cart
      const isAlreadyInCart = cart.items.some(item => 
        item.product.toString() === listing._id.toString()
      );
  
      if (!isAlreadyInCart) {
        cart.items.push({
          product: listing._id,
          addedAt: new Date()
        });
  
        await cart.save();
      } else {
        console.log(`Listing ${listing._id} is already in the cart of user ${listing.last_bid_user_id}`);
      }
    } catch (error) {
      console.error('Error adding to winner cart:', error);
      throw error;
    }
  }

  async sendAuctionEndNotifications(listing) {
    try {
      // Seller notification
      await this.notificationQueue.add({
        userId: listing.seller_id._id, 
        type: 'auction_sold',
        message: `Your auction for "${listing.make} ${listing.model}" has been sold for $${listing.current_bid}`
      });
    
      // Winner notification
      if (listing.last_bid_user_id) {
        await this.notificationQueue.add({
          userId: listing.last_bid_user_id._id,
          type: 'auction_won',
          message: `Congratulations! You won the auction for "${listing.make} ${listing.model}" at $${listing.current_bid}`
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  setupQueueEvents() {
    // Auction End Queue Events
    this.auctionEndQueue.on('completed', (job, result) => {
      console.log(`Auction End Job ${job.id} completed:`, result);
    });

    // Notification Queue Processor
    this.notificationQueue.process(async (job) => {
      const { userId, type, message } = job.data;
      
      try {
        console.log(`Sending notification to User ${userId}: ${message}`);
        // Here you would typically integrate with your actual notification service
        // For example: await notificationService.send(userId, message);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        throw error;
      }
    });
  }

  stopAuctionMonitoring() {
    if (this.auctionCheckInterval) {
      clearInterval(this.auctionCheckInterval);
      this.auctionCheckInterval = null;
    }
  }

  async scheduleAuctionEnd(listing) {
    try {
      const now = Date.now();
      const endTime = listing.end_date.getTime();
      const delay = Math.max(0, endTime - now);
      
      const jobId = `auction:${listing._id}`;
      
      // Check for existing job using a more specific ID
      const existingJob = await this.auctionEndQueue.getJob(jobId);
      
      if (!existingJob) {
        return this.auctionEndQueue.add(
          { listingId: listing._id },
          {
            ...this.QUEUE_CONFIG.defaultJobOptions,
            delay,
            jobId // Use consistent job ID for deduplication
          }
        );
      }
    } catch (error) {
      console.error('Error scheduling auction end:', error);
      throw error;
    }
  }

  async processExistingAuctions() {
    try {
      const batchSize = 100; // Process in batches to avoid memory issues
      let processedCount = 0;
      
      // Use cursor-based pagination
      let lastId = null;
      
      while (true) {
        const query = {
          type: 'Auction',
          status: 'active',
          end_date: { $lte: new Date() }
        };
        
        if (lastId) {
          query._id = { $gt: lastId };
        }
        
        const activeListings = await Listing.find(query)
          .limit(batchSize)
          .sort({ _id: 1 });
          
        if (activeListings.length === 0) break;
        
        // Process batch
        const jobs = activeListings.map(listing => ({
          name: 'auction-end',
          data: { listingId: listing._id },
          opts: {
            ...this.QUEUE_CONFIG.defaultJobOptions,
            jobId: `auction:${listing._id}`
          }
        }));
        
        await this.auctionEndQueue.addBulk(jobs);
        
        processedCount += activeListings.length;
        lastId = activeListings[activeListings.length - 1]._id;
        
        console.log(`Processed ${processedCount} expired auctions`);
      }

      return {
        success: true,
        processedCount
      };
    } catch (error) {
      console.error('Error processing existing auctions:', error);
      throw error;
    }
  }

  async cleanupOldJobs() {
    try {
      await this.auctionEndQueue.clean(24 * 3600 * 1000); // Clean jobs older than 24 hours
      await this.notificationQueue.clean(24 * 3600 * 1000);
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }

  // Add health check method
  async getQueueHealth() {
    const queues = {
      'auction-end': this.auctionEndQueue,
      'notifications': this.notificationQueue
    };
    
    const health = {};
    
    for (const [name, queue] of Object.entries(queues)) {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
      ]);
      
      health[name] = {
        waiting,
        active,
        completed,
        failed,
        status: failed > 0 ? 'warning' : 'healthy'
      };
    }
    
    return health;
  }

  // Add graceful shutdown method
  async shutdown() {
    this.stopAuctionMonitoring();
    
    // Close all queues
    await Promise.all([
      this.auctionEndQueue.close(),
      this.notificationQueue.close()
    ]);
    
    await this.cleanupOldJobs();
  }
}

// Export a singleton instance
module.exports = new QueueService();