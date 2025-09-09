const express = require('express');
const router = express.Router();

const AUTH_CONTROLLER = require('../../controllers/viewAuthController');

router.get('/signup/:gameID', AUTH_CONTROLLER.getSignup);
router.get('/signin/:gameID', AUTH_CONTROLLER.getSignin);

module.exports = router;