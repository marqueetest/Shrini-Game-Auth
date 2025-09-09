const express = require('express');
const router = express.Router();
const AUTH_CONTROLLER = require('../../controllers/apiAuthController');


router.post('/signup/:gameID', AUTH_CONTROLLER.postSignup);
router.post('/signin/:gameID', AUTH_CONTROLLER.postSignin);
router.post('/forgot-password/:gameID', AUTH_CONTROLLER.forgotPassword);
router.post('/validate-otp', AUTH_CONTROLLER.validateOTP);
router.post('/reset-password', AUTH_CONTROLLER.resetPassword);

module.exports = router;