const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, req) => {
    try {
      await ActivityLog.create({
        userId,
        action,
        details,
        ipAddress: req.ip
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

module.exports = logActivity