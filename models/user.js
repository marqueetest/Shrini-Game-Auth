const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email       : { type: String, required: true },
    displayName : { type: String, required: true },
    password    : { type: String, required: true },
    dob         : { type: Date, required: true },
    gender      : { type: String, required: true },
    gameID      : { type: String, required: true },
    otp         : { type: String, default: null },
    otpExpiry   : { type: Date, default: null },
    otpVerified : { type: Boolean, default: false },
    isDeleted   : { type: Boolean, default: false }
});

userSchema.index({ email: 1, gameID: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);