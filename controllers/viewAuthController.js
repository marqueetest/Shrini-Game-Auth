// controllers/viewAuthController.js

exports.getSignup = async (req, res) => {
    const { gameID } = req.params;
    res.render('signup', { gameID });
};

exports.getSignin = async (req, res) => {
    const { gameID } = req.params;
    res.render('signin', { gameID });
};
