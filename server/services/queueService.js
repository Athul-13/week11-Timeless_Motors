const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const NotificationService = require('./notificationServices');
const CartTimeoutService = require('./cartTimeoutService');

class QueueService {
  constructor() {
    // Define queue names as constants
    this.QUEUES = {
      AUCTION_END: 'auction-end'
    };

    // Queue configurations
    this.QUEUE_CONFIG = {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,  // Change to false temporarily for debugging
        timeout: 30000,
        stallInterval: 5000
      }
    };

    // Initialize queue
    this.auctionEndQueue = new Queue(this.QUEUES.AUCTION_END, { 
      redis: redisConfig,
      settings: {
        stalledInterval: 5000, // Check for stalled jobs more frequently
        lockDuration: 30000    // Increase lock duration
      }
    });

    this.initializeQueue();

    // // Initialize queue handlers
    // this.initializeQueueHandlers();
    // this.startAuctionMonitoring();

    // // Process existing expired auctions on startup
    // this.processExistingAuctions();
  }

  async initializeQueue() {
    try {
      // Wait for Redis connection
      await this.auctionEndQueue.isReady();
      const client = this.auctionEndQueue.client;
    console.log('Redis connection status:', client.status);
      console.log('Queue ready for processing');

      await this.checkFailedJobs();

      // Setup processors after queue is ready
      this.setupProcessors();
      this.initializeQueueHandlers();
      this.startAuctionMonitoring();

      // Process existing auctions only after queue is fully initialized
      await this.processExistingAuctions();
    } catch (error) {
      console.error('Failed to initialize queue:', error);
      throw error;
    }
  }

  initializeQueueHandlers() {
    this.auctionEndQueue.on('error', error => {
      console.error(`Queue Error (${this.QUEUES.AUCTION_END}):`, error);
    });

    this.auctionEndQueue.on('failed', (job, error) => {
      console.error(`Job Failed (${this.QUEUES.AUCTION_END}, Job ID: ${job.id}):`, error);
    });

    this.auctionEndQueue.on('stalled', (jobId) => {
      console.warn(`Job stalled (${this.QUEUES.AUCTION_END}, Job ID: ${jobId})`);
    });

    this.auctionEndQueue.on('completed', (job, result) => {
      console.log(`Auction End Job ${job.id} completed:`, result);
    });
  }

  setupProcessors() {
    console.log('Setting up processors...');
    this.auctionEndQueue.process('auction-end', async (job) => {
      console.log('Starting to process job:', job.id);
      const { listingId } = job.data;
      console.log(`Processing auction end for listing ${listingId}`);
  
      try {
        // Find the listing
        const listing = await Listing.findById(listingId)
          .populate('seller_id')
          .populate('last_bid_user_id');
  
        if (!listing) {
          console.error(`Listing not found: ${listingId}`);
          throw new Error(`Listing not found: ${listingId}`);
        }
  
        // Validate auction end conditions
        if (listing.status !== 'active') {
          console.log(`Listing ${listingId} is not active, current status: ${listing.status}`);
          return { success: false, message: 'Listing is not active' };
        }
  
        // Process winning bid
        if (listing.last_bid_user_id) {
          console.log(`Processing winning bid for listing ${listingId} by user ${listing.last_bid_user_id._id}`);
          
          // Add to winner's cart
          await this.addToWinnerCart(listing);
  
          // Send notifications
          await this.sendAuctionEndNotifications(listing);
        } else {
          console.log(`No winning bid for listing ${listingId}`);
        }

        // Update listing status
        await Listing.findByIdAndUpdate(listingId, { status: 'expired' });
        console.log(`Updated listing ${listingId} status to expired`);
  
        return { 
          success: true, 
          message: `Auction ended for listing ${listingId}`,
          hadWinner: !!listing.last_bid_user_id
        };
      } catch (error) {
        console.error('Auction end processing error:', error);
        throw error;
      }
    });
  }

  async addToWinnerCart(listing) {
    try {
      console.log(`Attempting to add listing ${listing._id} to winner's cart`);
      
      // Check if item is already in cart
      const existingCart = await Cart.findOne({
        user: listing.last_bid_user_id._id,
        'items.product': listing._id
      });

      if (existingCart) {
        console.log(`Listing ${listing._id} is already in the cart of user ${listing.last_bid_user_id._id}`);
        return;
      }

      // Add to winner's cart
      await Cart.findOneAndUpdate(
        { user: listing.last_bid_user_id._id },
        { 
          $push: { 
            items: {
              product: listing._id,
              addedAt: new Date()
            }
          }
        },
        { upsert: true }
      );

      console.log(`Successfully added listing ${listing._id} to winner's cart`);

      await CartTimeoutService.scheduleCartTimeout(
        listing._id, 
        listing.last_bid_user_id._id
      );
    } catch (error) {
      console.error('Error adding to winner cart:', error);
      throw error;
    }
  }

  async sendAuctionEndNotifications(listing) {
    try {
      console.log(`Sending auction end notifications for listing ${listing._id}`);

      // Send notification to winner
      await NotificationService.sendBidWonNotification(
        listing.last_bid_user_id._id,
        listing,
        listing.current_bid
      );
      console.log(`Sent win notification to user ${listing.last_bid_user_id._id}`);

      // Notify other bidders if needed
      // You can add additional notification types here
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  startAuctionMonitoring() {
    console.log('Starting auction monitoring');
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

        console.log(`Found ${nearEndAuctions.length} auctions ending soon`);

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

  async processExistingAuctions() {
    try {
      console.log('Processing existing expired auctions...');
      
      // First, check for and handle any failed jobs
      const failedJobs = await this.auctionEndQueue.getFailed();
      if (failedJobs.length > 0) {
        console.log(`Found ${failedJobs.length} failed jobs. Examining failures...`);
        
        for (const job of failedJobs) {
          console.log(`Failed job ${job.id} details:`, {
            failedReason: job.failedReason,
            stacktrace: job.stacktrace,
            data: job.data,
            opts: job.opts
          });
          
          // Retry failed jobs if they haven't exceeded max attempts
          if (job.attemptsMade < job.opts.attempts) {
            await job.retry();
            console.log(`Retrying job ${job.id}`);
          } else {
            console.log(`Job ${job.id} has exceeded max attempts. Removing...`);
            await job.remove();
          }
        }
      }
  
      const batchSize = 100;
      let processedCount = 0;
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
        
        const expiredListings = await Listing.find(query)
          .limit(batchSize)
          .sort({ _id: 1 });
          
        if (expiredListings.length === 0) break;
        
        console.log(`Found ${expiredListings.length} expired listings to process`);
        
        // Process jobs sequentially
        for (const listing of expiredListings) {
          const jobId = `auction:${listing._id}`;
          
          // Check existing job and its state
          const existingJob = await this.auctionEndQueue.getJob(jobId);
          if (existingJob) {
            const state = await existingJob.getState();
            if (state === 'failed') {
              console.log(`Retrying failed job ${jobId}`);
              await existingJob.retry();
            } else {
              console.log(`Existing job ${jobId} found in state: ${state}`);
            }
            continue;
          }
  
          // Add new job with enhanced error handling
          const job = await this.auctionEndQueue.add('auction-end', 
            { 
              listingId: listing._id,
              retryCount: 0  // Add retry counter
            },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000  // Increased initial delay
              },
              timeout: 30000,
              removeOnComplete: false,  // Keep completed jobs for debugging
              removeOnFail: false      // Keep failed jobs for debugging
            }
          );
          
          console.log(`Added new job ${job.id} for listing ${listing._id}`);
          
          // Monitor initial job state
          const jobState = await job.getState();
          console.log(`Job ${job.id} initial state: ${jobState}`);
          
          // Wait briefly between jobs
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Log current queue status
        const queueState = await this.getQueueHealth();
        console.log('Current queue status:', queueState);
        
        processedCount += expiredListings.length;
        lastId = expiredListings[expiredListings.length - 1]._id;
      }
  
      return { success: true, processedCount };
    } catch (error) {
      console.error('Error processing existing auctions:', error);
      throw error;
    }
  }

    // To check failed jobs
  async checkFailedJobs() {
    const failedJobs = await this.auctionEndQueue.getFailed();
    for (const job of failedJobs) {
      console.log('Failed job details:', {
        id: job.id,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        data: job.data
      });
    }
  }

  async scheduleAuctionEnd(listing) {
    try {
      const now = Date.now();
      const endTime = listing.end_date.getTime();
      const delay = Math.max(0, endTime - now);
      
      const jobId = `auction:${listing._id}`;
      
      // Check for existing job
      const existingJob = await this.auctionEndQueue.getJob(jobId);
      
      if (!existingJob) {
        console.log(`Scheduling auction end for listing ${listing._id} with delay ${delay}ms`);
        // IMPORTANT: Add the job type when adding a new job
        return this.auctionEndQueue.add('auction-end', { listingId: listing._id }, {
            ...this.QUEUE_CONFIG.defaultJobOptions,
            delay,
            jobId
        });
    } else {
        console.log(`Job already exists for listing ${listing._id}`);
      }
    } catch (error) {
      console.error('Error scheduling auction end:', error);
      throw error;
    }
  }

  async getQueueHealth() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.auctionEndQueue.getWaitingCount(),
      this.auctionEndQueue.getActiveCount(),
      this.auctionEndQueue.getCompletedCount(),
      this.auctionEndQueue.getFailedCount()
    ]);
    
    return {
      'auction-end': {
        waiting,
        active,
        completed,
        failed,
        status: failed > 0 ? 'warning' : 'healthy'
      }
    };
  }

  async shutdown() {
    console.log('Shutting down queue service...');
    if (this.auctionCheckInterval) {
      clearInterval(this.auctionCheckInterval);
      this.auctionCheckInterval = null;
    }
    
    await this.auctionEndQueue.close();
    console.log('Queue service shutdown complete');
  }
}

// Export a singleton instance
module.exports = new QueueService();