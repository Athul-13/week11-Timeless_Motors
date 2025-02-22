const Queue = require('bull');
const { redisConfig } = require('../config/redis');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Cart = require('../models/Cart');
const NotificationService = require('./notificationServices');

class PaymentMonitorService {
  constructor() {
    // Define queue name
    this.QUEUE_NAME = 'payment-monitor';

    // Queue configurations
    this.QUEUE_CONFIG = {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        timeout: 30000,
        stallInterval: 5000
      }
    };

    // Initialize queue
    this.paymentQueue = new Queue(this.QUEUE_NAME, {
      redis: redisConfig,
      settings: {
        stalledInterval: 5000,
        lockDuration: 30000
      }
    });

    this.initializeQueue();
  }

  async initializeQueue() {
    try {
      // Wait for Redis connection
      await this.paymentQueue.isReady();
      const client = this.paymentQueue.client;
      console.log('Payment monitor Redis connection status:', client.status);

      await this.checkFailedJobs();

      // Setup processors and handlers
      this.setupProcessors();
      this.initializeQueueHandlers();
      this.startPaymentMonitoring();

      // Process existing pending payments
      await this.processExistingPayments();
    } catch (error) {
      console.error('Failed to initialize payment monitor queue:', error);
      throw error;
    }
  }

  initializeQueueHandlers() {
    this.paymentQueue.on('error', error => {
      console.error(`Queue Error (${this.QUEUE_NAME}):`, error);
    });

    this.paymentQueue.on('failed', (job, error) => {
      console.error(`Job Failed (${this.QUEUE_NAME}, Job ID: ${job.id}):`, error);
    });

    this.paymentQueue.on('stalled', (jobId) => {
      console.warn(`Job stalled (${this.QUEUE_NAME}, Job ID: ${jobId})`);
    });

    this.paymentQueue.on('completed', (job, result) => {
      console.log(`Payment Monitor Job ${job.id} completed:`, result);
    });
  }

  setupProcessors() {
    console.log('Setting up payment monitor processors...');
    this.paymentQueue.process('check-payment', async (job) => {
      console.log('Processing payment check job:', job.id);
      const { orderId } = job.data;

      try {
        const order = await Order.findById(orderId)
          .populate('product')
          .populate('user');

        if (!order) {
          throw new Error(`Order not found: ${orderId}`);
        }

        // Check if payment is still pending
        if (order.payment.status !== 'Pending') {
          return { success: true, message: 'Payment already processed' };
        }

        if (order.orderType === 'Auction') {
          return await this.processAuctionOrder(order);
        } else {
          return await this.processFixedPriceOrder(order);
        }
      } catch (error) {
        console.error('Payment check processing error:', error);
        throw error;
      }
    });
  }

  async processAuctionOrder(order) {
    try {
      // Check if item is still in cart
      const isInCart = await Cart.exists({
        user: order.user._id,
        'items.product': order.product._id,
        status: 'active'
      });

      if (!isInCart) {
        // Cancel order and update listing
        await this.cancelOrder(order);
        await this.updateListingStatus(order.product._id, 'expired');

        // Notify user
        await NotificationService.sendPaymentTimeoutNotification(
          order.user._id,
          order.product,
          order.orderNumber
        );

        return {
          success: true,
          message: `Auction order ${order.orderNumber} cancelled due to payment timeout`
        };
      }

      return {
        success: true,
        message: `Order ${order.orderNumber} still in cart, maintaining pending status`
      };
    } catch (error) {
      console.error('Error processing auction order payment:', error);
      throw error;
    }
  }

  async processFixedPriceOrder(order) {
    try {
      // Calculate 48 hours ago
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      // Check if order is older than 48 hours
      if (order.createdAt <= fortyEightHoursAgo) {
        // Cancel order
        await this.cancelOrder(order);
        
        // Update listing status back to active
        await this.updateListingStatus(order.product._id, 'active');
        
        // Notify user about order cancellation
        await NotificationService.sendPaymentTimeoutNotification(
          order.user._id,
          order.product,
          order.orderNumber
        );
        
        return {
          success: true,
          message: `Fixed price order ${order.orderNumber} cancelled due to payment timeout (48 hours)`
        };
      }
      
      // Order is still within 48-hour window
      return {
        success: true,
        message: `Fixed price order ${order.orderNumber} is within payment window`
      };
    } catch (error) {
      console.error('Error processing fixed price order payment:', error);
      throw error;
    }
  }

  async cancelOrder(order) {
    await Order.findByIdAndDelete(order._id);

    // await Order.findByIdAndUpdate(order._id, {
    //   orderStatus: 'Cancelled',
    //   'payment.status': 'Failed',
    //   'timestamps.cancelledAt': new Date(),
    //   cancellation: {
    //     reason: 'Payment timeout',
    //     description: 'Order cancelled due to payment not completed within timeout period',
    //     requestedAt: new Date(),
    //     processedAt: new Date()
    //   }
    // });
  }

  async updateListingStatus(listingId, status) {
    await Listing.findByIdAndUpdate(listingId, { status });
  }

  startPaymentMonitoring() {
    console.log('Starting payment monitoring');
    // Check pending payments every 5 minutes
    this.paymentCheckInterval = setInterval(async () => {
      try {
        // Find auction orders older than 15 minutes
        const pendingAuctionOrders = await Order.find({
          'payment.status': 'Pending',
          orderType: 'Auction',
          createdAt: { 
            $lte: new Date(Date.now() - 15 * 60 * 1000) // Orders older than 15 minutes
          }
        });

        // Find fixed price orders older than 48 hours
        const pendingFixedPriceOrders = await Order.find({
          'payment.status': 'Pending',
          orderType: 'FixedPrice',
          createdAt: { 
            $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Orders older than 48 hours
          }
        });

        const allPendingOrders = [...pendingAuctionOrders, ...pendingFixedPriceOrders];
        console.log(`Found ${allPendingOrders.length} pending payment orders to check ` +
          `(${pendingAuctionOrders.length} auction, ${pendingFixedPriceOrders.length} fixed price)`);

        for (const order of allPendingOrders) {
          await this.schedulePaymentCheck(order);
        }
      } catch (error) {
        console.error('Error in payment monitoring:', error);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  async schedulePaymentCheck(order) {
    try {
      const jobId = `payment:${order._id}`;
      
      // Check for existing job
      const existingJob = await this.paymentQueue.getJob(jobId);
      
      if (!existingJob) {
        console.log(`Scheduling payment check for order ${order._id}`);
        return this.paymentQueue.add('check-payment', 
          { orderId: order._id },
          {
            ...this.QUEUE_CONFIG.defaultJobOptions,
            jobId
          }
        );
      } else {
        console.log(`Payment check job already exists for order ${order._id}`);
      }
    } catch (error) {
      console.error('Error scheduling payment check:', error);
      throw error;
    }
  }

  async processExistingPayments() {
    try {
      console.log('Processing existing pending payments...');
      
      const pendingOrders = await Order.find({
        'payment.status': 'Pending'
      });

      console.log(`Found ${pendingOrders.length} pending orders to process`);

      for (const order of pendingOrders) {
        await this.schedulePaymentCheck(order);
      }

      return { success: true, processedCount: pendingOrders.length };
    } catch (error) {
      console.error('Error processing existing payments:', error);
      throw error;
    }
  }

  async checkFailedJobs() {
    const failedJobs = await this.paymentQueue.getFailed();
    for (const job of failedJobs) {
      console.log('Failed payment job details:', {
        id: job.id,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        data: job.data
      });
    }
  }

  async getQueueHealth() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.paymentQueue.getWaitingCount(),
      this.paymentQueue.getActiveCount(),
      this.paymentQueue.getCompletedCount(),
      this.paymentQueue.getFailedCount()
    ]);
    
    return {
      [this.QUEUE_NAME]: {
        waiting,
        active,
        completed,
        failed,
        status: failed > 0 ? 'warning' : 'healthy'
      }
    };
  }

  async shutdown() {
    console.log('Shutting down payment monitor queue...');
    if (this.paymentCheckInterval) {
      clearInterval(this.paymentCheckInterval);
    }
    await this.paymentQueue.close();
    console.log('Payment monitor queue shutdown complete');
  }
}

module.exports = new PaymentMonitorService();