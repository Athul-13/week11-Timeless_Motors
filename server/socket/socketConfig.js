const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const NotificationService = require('../services/notificationServices');
const {Server} = require('socket.io');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "https://week11-timeless-motors.vercel.app"],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Initialize NotificationService with socket instance
    NotificationService.initialize(io);

    // Socket middleware for authentication 
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decoded.userId);

            if (!user || user.status === 'inactive') {
                return next(new Error('User not authorized'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    // const createNotification = async (recipientId, type, data) => {
    //     try {
    //         const notification = new Notification({
    //             recipient: recipientId,
    //             type: type,
    //             read: false,
    //             data: data
    //         });
            
    //         await notification.save();
            
    //         // Populate necessary fields before emitting
    //         const populatedNotification = await Notification.findById(notification._id)
    //             .populate('data.senderId', 'first_name last_name profile_picture')
    //             .populate('data.listingId', 'make model year images');
            
    //         io.to(recipientId.toString()).emit('newNotification', populatedNotification);
    //         return notification;
    //     } catch (error) {
    //         console.error('Error creating notification:', error);
    //         throw error;
    //     }
    // };

    io.on('connection', (socket) => {
        console.log('User connected:', socket.user?._id);
        socket.join(socket.user._id.toString());

        socket.on('fetchConversations', async (callback) => {
            try {
                const userId = socket.user._id; // Logged-in user
        
                const chats = await Chat.find({ 
                    participants: userId, 
                    isActive: true 
                })
                .populate({
                    path: 'participants',
                    select: 'first_name last_name profile_picture'
                })
                .populate(
                    'listingId',
                )
                .populate({
                    path: 'lastMessage',
                    populate: {
                        path: 'sender',
                        select: 'first_name last_name _id'
                    }
                })
                .sort({ updatedAt: -1 });
        
                // Categorized conversations
                const conversations = { received: {}, sent: {} };
        
                for (const chat of chats) {
                    const isSeller = chat.listingId.seller_id.toString() === userId.toString();
                    const otherParticipant = chat.participants.find(p => p._id.toString() !== userId.toString());
                    if (!otherParticipant) continue;
        
                    // Get messages for this chat
                    const messages = await Message.find({ chat: chat._id })
                        .sort({ createdAt: 1 })
                        .populate('sender', 'first_name last_name _id');
        
                    const processedMessages = messages.map(msg => ({
                        text: msg.content,
                        sender: msg.sender._id.toString() === userId.toString() ? 'me' : msg.sender._id,
                        timestamp: msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }));
        
                    // Determine the conversation type
                    const conversationType = isSeller ? 'received' : 'sent';
        
                    if (!conversations[conversationType][chat.listingId._id]) {
                        conversations[conversationType][chat.listingId._id] = {
                            productDetails: {
                                id: chat.listingId._id,
                                name: `${chat.listingId.make} ${chat.listingId.model} (${chat.listingId.year})`,
                                image: chat.listingId.images[0]?.url || ''
                            },
                            users: {}
                        };
                    }
        
                    conversations[conversationType][chat.listingId._id].users[otherParticipant._id] = {
                        chatId: chat._id,
                        name: `${otherParticipant.first_name} ${otherParticipant.last_name}`,
                        profilePicture: otherParticipant.profile_picture,
                        messages: processedMessages
                    };
                }
        
                callback(conversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
                callback({ error: 'Failed to fetch conversations', details: error.message });
            }
        });

        socket.on('sendInitialMessage', async (data) => {
            try {
                console.log('message received:', data);
                
                const chat = await Chat.findOneAndUpdate(
                    {
                        $or: [
                            { participants: [socket.user._id, data.sellerId] },
                            { participants: [data.sellerId, socket.user._id] }
                        ]
                    },
                    {
                        $setOnInsert: {
                            participants: [socket.user._id, data.sellerId],
                            listingId: data.listingId
                        }
                    },
                    { upsert: true, new: true }
                ).populate('listingId');
        
                const message = new Message({
                    chat: chat._id,
                    sender: socket.user._id,
                    content: data.message,
                    listing: data.listingId
                });
                await message.save();
        
                await Chat.findByIdAndUpdate(chat._id, {
                    lastMessage: message._id,
                    updatedAt: new Date()
                });
        
                const isSeller = chat.listingId.seller_id.toString() === socket.user._id.toString();
                const recipientId = isSeller ? data.sellerId : socket.user._id;
        
                const messagePayload = {
                    chatId: chat._id,
                    message: {
                        content: data.message,
                        sender: {
                            _id: socket.user._id,
                            name: `${socket.user.first_name} ${socket.user.last_name}`
                        },
                        createdAt: message.createdAt
                    }
                };
        
                // Emit to recipient as "Received" if they are the seller
                io.to(recipientId.toString()).emit('newMessage', {
                    ...messagePayload,
                    type: isSeller ? 'received' : 'sent'
                });
        
                // Emit confirmation to sender
                socket.emit('newMessage', {
                    ...messagePayload,
                    type: isSeller ? 'sent' : 'received',
                    status: 'delivered'
                });
        
                await NotificationService.sendMessageNotification(
                    data.sellerId,
                    chat._id,
                    socket.user._id,
                    data.message,
                    chat.listingId
                );
        
            } catch (error) {
                console.error('Error handling initial message:', error);
                socket.emit('messageError', { message: 'Failed to send message' });
            }
        });
        

        socket.on('sendMessage', async (data) => {
            try {
                const chat = await Chat.findById(data.chatId).populate('listingId');
                if (!chat) throw new Error('Chat not found');
        
                const message = new Message({
                    chat: data.chatId,
                    sender: socket.user._id,
                    content: data.message,
                    listing: chat.listingId
                });
                await message.save();
        
                await Chat.findByIdAndUpdate(data.chatId, {
                    lastMessage: message._id,
                    updatedAt: new Date()
                });
        
                const recipientId = chat.participants.find(p => p.toString() !== socket.user._id.toString());
                if (recipientId) {
                    await NotificationService.sendMessageNotification(
                        recipientId,
                        chat._id,
                        socket.user._id,
                        data.message,
                        chat.listingId
                    );
                }
        
                const isSeller = chat.listingId.seller_id.toString() === socket.user._id.toString();
        
                const messagePayload = {
                    chatId: data.chatId,
                    message: {
                        content: data.message,
                        sender: {
                            _id: socket.user._id,
                            name: `${socket.user.first_name} ${socket.user.last_name}`
                        },
                        createdAt: message.createdAt
                    }
                };
        
                io.to(recipientId.toString()).emit('newMessage', {
                    ...messagePayload,
                    type: isSeller ? 'received' : 'sent'
                });
        
                socket.emit('newMessage', {
                    ...messagePayload,
                    type: isSeller ? 'sent' : 'received',
                    status: 'delivered'
                });
        
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('messageError', { message: 'Failed to send message' });
            }
        });
        
        socket.on('leaveRoom', ({ roomId }) => {
            console.log(`User ${socket.user?._id} left room: ${roomId}`);
            socket.leave(roomId);
        });
        

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user?._id);
        });
    });

    return io;
};

module.exports = initializeSocket;