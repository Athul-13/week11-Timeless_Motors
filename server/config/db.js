const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MonogDb connected');
    }
    catch (err) {
        console.error('MongoDb connection error',err);
    }
};

module.exports = connectDB;