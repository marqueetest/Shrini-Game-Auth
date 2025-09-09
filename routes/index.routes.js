

const router = require('express').Router();

router.use('/api/v1', require('./api/index.routes'));

router.use("/", require('./web/index.routes'));

module.exports = router;