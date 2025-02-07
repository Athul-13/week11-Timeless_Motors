const ActivityLog = require('../models/ActivityLog');

exports.getAllActivity = async (req, res) => {
    try {
        const activityLog = await ActivityLog.find()
            .populate('userId', 'first_name last_name email profile_picture'); 
            
        res.status(200).json(activityLog);
    } catch (err) {
        console.error('Error fetching activity:', err);
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
};
