const fs = require('fs/promises');
const crypto = require('crypto');

//유저에 맞는 해쉬값 생성
const makeHash = (id, pass) => {
    const salt = 'whguswo';
    return crypto.createHash('sha512').update(`${id}${salt}${pass}`).digest('base64');
};

//파일에 유저해쉬 기록
const addUser = async(id, mail, hash) => {
    await fs.writeFile(`./login/mail/${mail}`, hash, { encoding: 'utf-8' });
    await fs.writeFile(`./login/id/${id}`, hash, { encoding: 'utf-8' });
};

//유저정보 파일에서 읽어오기
const readUser = async id => {
    let user = null;
    try {
        user = await fs.readFile(`./login/id/${id}`, { encoding: 'utf-8' });
    } catch (err) {
        user = '';
    }
    return user;
};

//해쉬가 맞는지 여부 확인
const isIdHash = async(id, hash) => {
    const val = await readUser(id);
    if (val === hash) return true;
    else false;
};

//로그아웃
const isLogin = async(req, res, next) => {
    let { id, hash } = req.cookies;
    id = decodeURIComponent(id);
    hash = decodeURIComponent(hash);
    const val = await isIdHash(id, hash);
    console.log(req.originalUrl)
    if (decodeURIComponent(req.originalUrl) === '/login/signout') {
        res.clearCookie('id');
        res.clearCookie('hash');
        res.redirect('/login');
    } else if (val) {
        res.cookie('id', id, { maxAge: 1000 * 60 * 60 * 3 });
        res.cookie('hash', hash, { maxAge: 1000 * 60 * 60 * 3 });
        if (decodeURIComponent(req.baseUrl) === '/login') res.redirect('/main');
        else next();
    } else {
        if (decodeURIComponent(req.baseUrl) === '/login') {
            next();
        } else {
            res.clearCookie('id');
            res.clearCookie('hash');
            res.redirect('/login');
        }
    }
}

module.exports = { makeHash, addUser, isIdHash, isLogin };