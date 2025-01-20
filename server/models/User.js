const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.ObjectId
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    phone_no: {
        type: Number,
        trim: true,
        default: null
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'verified'],
        default: 'inactive',
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    profile_picture: {
        type: String,
        default: null
    },
    otp: {
        type: String,
        default: null
    },
    otpExpiresAt: {
        type: Date, // Store OTP expiration time
        default: null
    },
    refresh_token: String 
}, {timestamps: true});

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
};

userSchema.methods.isOtpExpired = function () {
    if (this.otpExpiresAt) {
        return Date.now() > this.otpExpiresAt;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);