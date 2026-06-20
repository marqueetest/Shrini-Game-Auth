const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../helpers/email');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const SECRET_KEY = process.env.SECRET_KEY;
const validator = require('validator');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.postSignup = async (req, res) => {
    const { email, displayName, password, dob, gender } = req.body;
    const { gameID } = req.params;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    const acceptedGenders = ['male', 'female', 'other'];
    if (!acceptedGenders.includes(gender)) {
        return res.status(400).json({ message: 'Gender must be male, female, or other.' });
    }

    try {
        const existingUser = await User.findOne({ email, gameID });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered for this game.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, displayName, password: hashedPassword, dob, gender, gameID });

        await newUser.save();

        const token = jwt.sign(
            { email, gameID, gender, displayName, dob },
            SECRET_KEY
        );

        return res.status(201).json({
            message: 'Registration successful!',
            data: {
                email,
                gameID,
                gender,
                displayName,
                token
            }
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
            return res.status(400).json({ message: 'Validation error', errors });
        } else {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
    }
};

exports.postSignin = async (req, res) => {
    const { email, password } = req.body;
    const { gameID } = req.params;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const user = await User.findOne({ email, gameID });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or game ID.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { email: user.email, gameID: user.gameID, displayName: user.displayName, gender: user.gender },
            SECRET_KEY
        );

        return res.status(200).json({
            message: 'Sign-in successful!',
            data: {
                email: user.email,
                gameID: user.gameID,
                displayName: user.displayName,
                gender: user.gender,
                token
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const { gameID } = req.params;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const user = await User.findOne({ email, gameID, isDeleted: false });
        if (!user) {
            return res.status(404).json({ message: 'User not found for this game.' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        const emailSent = await sendOTPEmail(email, otp, user.displayName);
        
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
        }

        return res.status(200).json({
            message: 'OTP sent successfully to your email address.',
            data: {
                userId: user._id
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { email } = req.body;
    const { gameID } = req.params;

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const user = await User.findOne({ email, gameID, isDeleted: false });
        if (!user) {
            return res.status(404).json({ message: 'User not found for this game.' });
        }

        await User.deleteOne({ email, gameID, isDeleted: false });

        return res.status(200).json({
            message: 'User Deleted Successfully.'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.validateOTP = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Valid userId is required.' });
    }

    if (!otp || otp.length !== 6) {
        return res.status(400).json({ message: 'OTP must be 6 digits.' });
    }

    try {
        const user = await User.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(404).json({ message: 'User not found for this game.' });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'No OTP found. Please request a new OTP.' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        user.otpVerified = true;
        await user.save();

        return res.status(200).json({
            message: 'OTP validated successfully.',
            data: {
                userId: user._id,
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { newPassword, userId } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Valid userId is required.' });
    }

    try {
        const user = await User.findOne({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(404).json({ message: 'User not found for this game.' });
        }

        if (!user.otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP expired. Please start the process again.' });
        }

        if (!user.otpVerified) {
            return res.status(400).json({ message: 'OTP not verified. Please verify OTP before resetting password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiry = null;
        user.otpVerified = false;
        await user.save();

        return res.status(200).json({
            message: 'Password reset successfully.'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
