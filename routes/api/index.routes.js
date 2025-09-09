const express = require('express');
const router = express.Router();
const AUTH_CONTROLLER = require('../../controllers/apiAuthController');


router.post('/signup/:gameID', AUTH_CONTROLLER.postSignup);
router.post('/signin/:gameID', AUTH_CONTROLLER.postSignin);

module.exports = router;