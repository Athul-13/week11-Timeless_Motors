const User = require('../models/User');

const VALID_STATUSES = ['active', 'inactive', 'verified'];

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.updateUserStatus = async (req, res) => {
    try {
        const {userId} = req.params;
        const {status} = req.body;

        if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Status must be one of: ${VALID_STATUSES.join(', ')}`
            });
        }

        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        if (user.status === status) {
            return res.status(200).json({
                success: true,
                message: "User status is already " + status,
                user
            });
        }

        user.status = status.toLowerCase();

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Error in updateUserStatus:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating user status"
        });
    }
}