const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const { isLogin } = require('./modules');

router.use(cookieParser());
router.use(express.json());
router.use(isLogin);

router.get('/', (req, res) => {
    res.render('main/main');
});
router.get('/:view', (req, res) =>
    res.render(`main/${req.params.view}`)
);

module.exports = router;