 const Notification = require('../models/Notification')

 let io;

class NotificationService {
    static initialize(socketIo) {
        io = socketIo;
    }

    static async sendNotification(recipientId, type, data) {
        try {
            const notification = await this.createNotificationInDB(recipientId, type, data);
            
            // Emit to connected user if they're online
            if (io) {
                io.to(recipientId.toString()).emit('newNotification', notification);
            }
            
            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    static async createNotificationInDB(recipientId, type, data) {
        const notification = new Notification({
            recipient: recipientId,
            type: type,
            read: false,
            data: data
        });
        
        await notification.save();
        
        // Populate necessary fields
        return await Notification.findById(notification._id)
            .populate('data.senderId', 'first_name last_name profile_picture')
            .populate('data.listingId', 'make model year images');
    }

    // Predefined notification types
    static async sendBidWonNotification(userId, listing, bidAmount) {
        return this.sendNotification(userId, 'bid_won', {
            listingId: listing._id,
            title: 'Bid Won',
            description: `Congratulations! You won the bid for ${listing.make} ${listing.model}`,
            bidAmount: bidAmount
        });
    }

    static async sendBidLostNotification(userId, listing) {
        return this.sendNotification(userId, 'bid_lost', {
            listingId: listing._id,
            title: 'Bid Lost',
            description: `Your bid for ${listing.make} ${listing.model} was not successful`
        });
    }

    static async sendMessageNotification(recipientId, chatId, senderId, message, listing) {
        return this.sendNotification(recipientId, 'message', {
            chatId: chatId,
            senderId: senderId,
            message: message.substring(0, 100),
            listingId: listing._id
        });
    }

    static async sendOrderReceivedNotification(sellerId, order) {
        return this.sendNotification(sellerId, 'order_received', {
            orderId: order._id,
            listingId: order.listing,
            title: 'New Order Received',
            description: `You have received a new order for ${order.listing.make} ${order.listing.model}`
        });
    }

    static async sendBidCascadeNotifications(listing, nextBidder) {
        try {
            // Notify previous bidder
            if (listing.last_bid_user_id) {
                await this.sendNotification(listing.last_bid_user_id, 'bid_lost', {
                    listingId: listing._id,
                    title: 'Cart Timeout',
                    description: `Your cart reservation for ${listing.make} ${listing.model} has expired`
                });
            }

            // Notify next bidder
            await this.sendNotification(nextBidder.user_id, 'bid_won', {
                listingId: listing._id,
                title: 'Auction Cascaded',
                description: `Good news! The auction for ${listing.make} ${listing.model} has cascaded to you. You have 48 hours to complete the purchase.`,
                bidAmount: nextBidder.bid_amount
            });
        } catch (error) {
            console.error('Error in bid cascade notifications:', error);
            throw error;
        }
    }

    static async sendPaymentTimeoutNotification(userId, product, orderNumber) {
        return this.sendNotification(userId, 'payment_timeout', {
            orderNumber: orderNumber,
            listingId: product._id,
            title: 'Order Canceled Due to Payment Timeout',
            description: `Your order #${orderNumber} for ${product.make} ${product.model} has been canceled as order was not completed within 48 hours.`
        });
    }
}

module.exports = NotificationService;