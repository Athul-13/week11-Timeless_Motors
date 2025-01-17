const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({message: 'Not authorized, no token'});
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        const user = await User.findById(decoded.userId).select('-password');
        req.user = user;
        
        next();
    } catch (err) {
        res.status(401).json({message: 'Not authorized, token failed'})
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

module.exports = { protect, authorize };