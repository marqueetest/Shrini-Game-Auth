const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/user');
const SECRET_KEY = process.env.SECRET_KEY;
const validator = require('validator');
const moment = require('moment');


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
