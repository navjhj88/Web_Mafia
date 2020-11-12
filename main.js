const express = require('express');
const cookieParser = require('cookie-parser');
const router = express.Router();
const { isLogin } = require('./modules');
const { Rooms } = require('./socket');
router.use(cookieParser());
router.use(express.json());
router.use(isLogin);

router.get('/', (req, res) => {
    res.render('main/main');
});
router.get('/:view', (req, res) => {
    const Room = Rooms.getAll();
    let obj = {};
    if(req.params.view === 'room'){
        obj.namespace = `'${req.query.id}'`;
    } else {
        obj.Rooms = Room.map(v => {
            let { id, name } = v;
            id = encodeURIComponent(id);
            return {id, name};
        });
    }
    console.log(obj.Rooms);
    res.render(`main/${req.params.view}`, obj);
});

module.exports = router;