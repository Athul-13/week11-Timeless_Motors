const User = require('../models/User');
const { generateOTP, sendOTP } = require('../utils/otpUtils');
const {generateAccessToken, generateRefreshToken} = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const logActivity = require('../utils/logActivity');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
};

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


        await user.save();

        await logActivity(user._id, "User Registered", "New user account created", req);

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
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});    }
};

exports.verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired, please request a new one' });
        }

        user.otp = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({email});

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
};

exports.changePassword = async (req, res) => {
    try {
        const {email, password} = req.body.userData;

        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = password;

        await user.save();

        await logActivity(user._id, "Password Changed", "User successfully changed password", req);

        res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await User.findOne({email});

        if (user.status === 'inactive') {
            await logActivity(user._id, "Blocked Login Attempt", "Blocked user tried to log in", req);
            return res.status(403).json({
                message: 'User has been blocked from logging in',
                showToast: true, 
            });
        }

        if(!user || !(await user.matchPassword(password))) {
            await logActivity(user?._id || "Unknown", "Failed Login Attempt", `Failed login attempt for email: ${email}`, req);
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: false,
            secure: true, 
            sameSite: 'Strict', 
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        await logActivity(user._id, "User Login", "User successfully logged in", req);

        res.json({
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_picture: user.profile_picture,
            phone_no: user.phone_no,
            email: user.email,
            status: user.status,
            role: user.role,
            accessToken
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: err.message});
    }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ 
            success: false, 
            message: 'Google credential is required' 
        });
    }
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();

    const { email, given_name, family_name, picture } = payload;

    const profilePicture = picture ? encodeURI(picture) : null;


    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
        user = new User({
        email,
        first_name: given_name,
        last_name: family_name,
        profile_picture: profilePicture,
        status: 'active',
        role: 'user',
        password: crypto.randomBytes(16).toString('hex') // Generate random password for Google users
      });
      
      await user.save();
    }

    if (user.status === "inactive") {
        // Log blocked login attempt
        await logActivity(user._id, "Google Login Failed", "Blocked user attempted login", req);
        return res.status(403).json({
            message: "User has been blocked from logging in",
            showToast: true,
        });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refresh_token = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    })

    await logActivity(user._id, "Google Login", "User logged in via Google", req);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profilePicture: user.profile_picture,
        status: user.status, 
        role: user.role
      },
      accessToken
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.refreshToken = null;
        await user.save();
        await logActivity(user._id, "Logout", "User logged out successfully", req);
        res.json({message: 'logout successfull'});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const {refreshToken} = req.body;

        if(!refreshToken) {
            return res.status(401).json({message: 'token not provided'});
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if(!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({message: 'invalid token'});
        }

        const accessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({accessToken, refreshToken: newRefreshToken});
    } catch (err) {
        res.status(401).json({message: 'invalid token'});
    }
}
