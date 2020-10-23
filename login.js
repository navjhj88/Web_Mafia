const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const cookieParser = require('cookie-parser');
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended:true}));
router.use(cookieParser());
const makeHash = (id, pass) => {
    const salt = 'whguswo';
    return crypto.createHash('sha512').update(`${id}${salt}${pass}`).digest('base64');
};

const verifyIdMail = (id, mail) => {
    let what = [id, mail].map(v => toVerify.has('ids', v));
    what = what.concat(what.some(v => v));
    return what;
};

const toVerify = {
    hash : new Map(),
    ids : new Set(),
    delete(hash, msg = 'mail 등록 중 완료!'){
        const {id, mail, set} = this.hash.get(hash);
        if(msg === 'mail 등록 중 완료!') clearTimeout(set);
        this.hash.delete(hash);
        this.ids.delete(id);
        this.ids.delete(mail);
        console.log(msg);
    },
    add(id, mail, hash){
        const set = setTimeout(() => {
            this.delete(hash, 'mail 등록 취소');
        }, 5 * 60 * 1000);
        this.hash.set(hash, {set, id, mail});
        this.ids.add(id);
        this.ids.add(mail);
        console.log('mail 등록 중...');
    },
    has(type, value){
        return this[type].has(value);
    },
};
const load = async()=>{
    const dir = await fs.readdir('login');
    console.log(dir);
};

const addUser = async(id, mail, hash) => {
    await fs.writeFile(`./login/mail/${mail}`, hash, { encoding: 'utf-8' });
    await fs.writeFile(`./login/id/${id}`, hash, { encoding: 'utf-8' });
}

const readUser = async(id) => {
    let user = null;
    try{
        user = await fs.readFile(`./login/id/${id}`, { encoding: 'utf-8' });
    }catch(err){
        user = '';
    }
    return user;
}

const transporter = nodemailer.createTransport({
    // 사용하고자 하는 서비스, gmail계정으로 전송할 예정이기에 'gmail'
    service: 'gmail',
    // host를 gmail로 설정
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        // Gmail 주소 입력, 'testmail@gmail.com'
        user: 'webmafiamailer@gmail.com',
        // Gmail 패스워드 입력
        pass: 'whguswo1234',
    },
});

router.get('/', (req, res) => 
res.render('login')).post('/', async(req, res) => {
    const { id, pass } = req.body;
    const hash = await makeHash(id, pass);
    const val = await readUser(id);
    console.log(val, hash);
    if(val === hash){
        res.render('main');
    } else {
        res.render('login', {msg : '존재하지 않는 id 또는 pass입니다.'});
    }
}).post('/verify', async(req, res) => {
    const { id, mail } = req.body;
    const what = verifyIdMail(id, mail);
    if(what[2]){
        const obj = {status: 'bad', id: what[0], mail: what[1]};
        res.end(JSON.stringify(obj));
    } else {
        res.end('{"status":"good"}');
    }
}).get('/verify', async(req, res) => {
    const hash = decodeURIComponent(req.query.hash);
    const id = decodeURIComponent(req.query.id);
    const mail = decodeURIComponent(req.query.mail);
    if (toVerify.has('hash', hash)) {
        toVerify.delete(hash);
        await addUser(id, mail, hash);
        res.render('Success');
    } else {
        res.render('error', {msg: '잘못된 접근'});
    }
}).post('/signup', async(req, res) => {
    const id = req.body.id;
    const pass = req.body.pass;
    const mail = req.body.mail;
    const hash = makeHash(id, pass);
    const dir = await fs.readdir('login');
    let flag = [false, false];
    if(verifyIdMail(id, mail)[2]){
        res.render('error', {msg: '이미 보낸 회원 정보입니다.'});
    } else if(dir.some(v => {
        const val = v.split(/(?:\.)((?:(?!\.).)+)$/).filter(v => v);
        return [mail, id].some((v, i) => {
            if(v === val[i]){
                flag[i] = true;
                return true;
            } else return false;
        });
    })){
        res.render('signup', { flag : `[${flag.join(',')}]` });
    } else {
        toVerify.add(id, mail, hash);
        const info = await transporter.sendMail({
            // 보내는 곳의 이름과, 메일 주소를 입력
            from: `"mafia" <webmafiamailer@gmail.com>`,
            // 받는 곳의 메일 주소를 입력
            to: mail,
            // 보내는 메일의 제목을 입력
            subject: 'Hello!!! This is Web_Mafia!!! Please Verify your email address.',
            // 보내는 메일의 내용을 입력
            // text: 일반 text로 작성된 내용
            // html: html로 작성된 내용
            html: `<h1>To Verify your account<br>Please, Click beleow link<br></h1><a href="http://localhost:3000/login/verify/?mail=${encodeURIComponent(mail)}&id=${encodeURIComponent(id)}&hash=${encodeURIComponent(hash)}">Verify</a>`,
        });
        res.render('mail');
    }
}).get('/signup', async(req, res) => {
    res.render('signup'); 
});
load();
module.exports = router;