const Redis = require('ioredis');
require('dotenv').config();


// Create Redis Cloud configuration
const redisConfig = {
  host: process.env.REDIS_CLOUD_HOST,
  port: process.env.REDIS_CLOUD_PORT || 10377,
  password: process.env.REDIS_CLOUD_PASSWORD,

  // Connection retry settings
  retryStrategy: (times) => {
    const maxRetryDelay = 2000;
    const delay = Math.min(times * 50, maxRetryDelay);
    return delay;
  },

  // Additional connection options
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  
  // Redis Cloud specific options
//   enableReadyCheck: true,
//   enableOfflineQueue: true,
  
  // Add reconnect settings
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Enhanced error handling
redisClient.on('error', (err) => {
  console.error('Redis Cloud Connection Error:', err);
  console.error('Connection Details:', {
    host: process.env.REDIS_CLOUD_HOST,
    port: process.env.REDIS_CLOUD_PORT,
    // Don't log the actual password
    hasPassword: !!process.env.REDIS_CLOUD_PASSWORD
  });
});

// Connection success event
redisClient.on('connect', () => {
  console.log('Connected to Redis Cloud successfully');
});

// Ready event
redisClient.on('ready', () => {
  console.log('Redis Cloud client is ready to process requests');
});

// Add reconnecting event
redisClient.on('reconnecting', (delay) => {
  console.log(`Reconnecting to Redis Cloud in ${delay}ms...`);
});

module.exports = {
  redisConfig,
  redisClient
};