const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                message: 'Not authorized to access this route',
                action: 'LOGOUT'
            });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.clearCookie('token');
            return res.status(401).json({ 
                message: 'User not found',
                action: 'LOGOUT'
            });
        }

        if (user.status === 'inactive') {
            res.clearCookie('token');
            return res.status(403).json({ 
                message: 'Your account has been blocked.',
                action: 'LOGOUT'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ 
            message: 'Invalid or expired token',
            action: 'LOGOUT'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({message: 'Not authorized to access this route'});
        }
        next();
    };
};

const optionalProtect = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            // Clear cookies/token if user not found
            res.clearCookie('token');
            return res.status(401).json({ 
                message: 'User not found', 
                action: 'LOGOUT'
            });
        }

        if (user.status === 'inactive') {
            // Clear cookies/token if user is blocked
            res.clearCookie('token');
            return res.status(403).json({ 
                message: 'Your account has been blocked.', 
                action: 'LOGOUT'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        // Clear cookies/token on invalid/expired token
        res.clearCookie('token');
        return res.status(401).json({ 
            message: 'Invalid or expired token', 
            action: 'LOGOUT'
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Emit event for real-time updates if using Socket.IO
        if (req.app.get('io')) {
            req.app.get('io').to(userId).emit('statusUpdate', { 
                status, 
                action: status === 'inactive' ? 'LOGOUT' : null 
            });
        }

        res.json({ message: 'User status updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user status' });
    }
};

module.exports = { protect, authorize, optionalProtect, updateUserStatus };