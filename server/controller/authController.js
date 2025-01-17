const User = require('../models/User');
const { generateOTP, sendOTP } = require('../utils/otpUtils');
const {generateAccessToken, generateRefreshToken} = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');

// register user
exports.register = async (req, res) => {
    try {
        const { first_name, last_name, phone_no, email, password} = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const userExists = await User.findOne({email});
        if(userExists) {
            return res.status(400).json({message: "User already exists"})
        }

        const otp = generateOTP(6);

        const expirationDuration = 1 * 60 * 1000; // OTP expiration set to 1 minute
        const otpExpiresAt = new Date(Date.now() + expirationDuration);

        const user = new User({
            first_name,
            last_name,
            phone_no,
            email,
            password,
            status: 'inactive',
            role: 'user',
            otp,
            otpExpiresAt
        });

        await user.save();

        await sendOTP(email, otp);
        console.log('OTP sent successfully',otp);
            
        return res.status(200).json({ 
                success: true, 
                message: 'OTP sent successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

exports.verifyOTP = async (req, res) => {
    try {
        const { first_name, last_name, phone_no, email, password, otp } = req.body;

        const user = await User.findOne({ email, status: 'inactive' });

        if (!user) {
            return res.status(400).json({ message: 'No pending verification found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired, please request a new one' });
        }

        user.status = 'active';
        user.first_name = first_name;
        user.last_name = last_name;
        user.phone_no = phone_no;
        user.password = password; 
        user.otp = undefined;

        const accessToken = generateAccessToken(user.user_id, user.role);
        const refreshToken = generateRefreshToken(user.user_id);

        user.refresh_token = refreshToken;

        await user.save();

        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        })

        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_no: user.phone_no,
                email: user.email,
                status: user.status,
                role: user.role
            },
            accessToken
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});    }
}

exports.resendOTP = async (req, res) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email, status: 'inactive' });

        if (!user) {
            return res.status(400).json({ message: "No such user found" });
        }

        const otp = generateOTP(6);

        const expirationDuration = 1 * 60 * 1000;
        const otpExpiresAt = new Date(Date.now() + expirationDuration);

        user.otp = otp;
        user.otpExpiresAt = otpExpiresAt;

        await user.save();

        await sendOTP(email, otp);
        console.log('OTP sent successfully',otp);

        return res.status(200).json({
            success: true,
            message: 'OTP resent successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});

        if(!user || !(await user.matchPassword(password))) {
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            profilePicture: user.profilePicture,
            phone_no: user.phone_no,
            email: user.email,
            status: user.status,
            role: user.role,
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
}