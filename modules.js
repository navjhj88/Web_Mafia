const fs = require('fs/promises');
const crypto = require('crypto');

const makeHash = (id, pass) => {
    const salt = 'whguswo';
    return crypto.createHash('sha512').update(`${id}${salt}${pass}`).digest('base64');
};

const addUser = async(id, mail, hash) => {
    await fs.writeFile(`./users/mail/${mail}`, hash, { encoding: 'utf-8' });
    await fs.writeFile(`./users/id/${id}`, hash, { encoding: 'utf-8' });
};

const readUser = async id => {
    let user = null;
    try{
        user = await fs.readFile(`./users/id/${id}`, { encoding: 'utf-8' });
    }catch(err){
        user = '';
    }
    return user;
};

const isIdHash = async (id, hash) => {
    const val = await readUser(id);
    if(val === hash) return true;
    else false;
};

const howCookie = (res, options) => {
    if(options.type === 'update'){
        let { id, hash } = options;
        res.cookie('id', id, { maxAge: 1000 * 60 * 60 * 3 });
        res.cookie('hash', hash, { maxAge: 1000 * 60 * 60 * 3 });
    } else if(options.type === 'clear'){
        res.clearCookie('id');
        res.clearCookie('hash');
    }
};

const isLogin = async (req, res, next) => {
    let { id, hash } = req.cookies;
    id = decodeURIComponent(id);
    hash = decodeURIComponent(hash);
    const val = await isIdHash(id, hash);
    console.log(req.originalUrl)
    if(!decodeURIComponent(req.originalUrl) === '/login/logout'){
        if(val) {
            howCookie(res, {type: 'update', id, hash});
            if(decodeURIComponent(req.baseUrl) === '/main') next();
            else res.redirect('/main');
        } else {
            if(decodeURIComponent(req.baseUrl) === '/login') {
                next();
            } else {
                howCookie(res, 'clear');
                res.redirect('/login');
            }
        }
    } else next();
}

module.exports = { makeHash, addUser, isIdHash, isLogin, howCookie };