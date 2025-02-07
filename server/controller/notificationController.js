const Notification = require('../models/Notification')

exports.fetchNotification = async (req, res) => {
    try {
        const userId = req.user._id; 
        const notifications = await Notification
        .find({ recipient: userId, read: false })
        .sort({ createdAt: -1 })
        .populate('data.senderId', 'first_name last_name email profile_picture')

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
}

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });

        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};