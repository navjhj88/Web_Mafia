const express = require('express');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const fs = require('fs/promises');
const router = express.Router();
const { makeHash, addUser, isIdHash, isLogin } = require('./modules');

router.use(cookieParser());
router.use(express.json());
router.use(express.urlencoded({extended:true}));
router.use(isLogin);

const verifyIdMail = (id, mail) => {
    console.log(toVerify);
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

router.get('/', async(req, res) => {
    res.render('login');
}).post('/', async(req, res) => {
    const { id, pass } = req.body;
    const hash = await makeHash(id, pass);
    const val = await isIdHash(id, hash);
    if(val) {
        res.cookie('id', id, { maxAge: 1000 * 60 * 60 * 3 });
        res.cookie('hash', hash, { maxAge: 1000 * 60 * 60 * 3 });
        res.redirect('/main');
    }
    else res.render('login', {msg : '존재하지 않는 id 또는 pass입니다.'});
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
    } else res.render('error', {msg: '잘못된 접근'});
}).post('/signup', async(req, res) => {
    const id = req.body.id;
    const pass = req.body.pass;
    const mail = req.body.mail;
    const hash = makeHash(id, pass);
    const idDir = await fs.readdir('./login/id');
    const mailDir = await fs.readdir('./login/mail');
    const idMail = [mail, id];
    const result = [mailDir, idDir].map((v, i) => v.some(t => t === idMail[i]));
    if(verifyIdMail(id, mail)[2]){
        res.render('error', {msg: '이미 보낸 회원 정보입니다.'});
    } else if(result.some(v => v)){
        res.render('signup', { flag : `[${result.join(',')}]` });
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

module.exports = router;