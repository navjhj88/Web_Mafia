const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs/promises')
const { makeHash, addUser, isIdHash, isLogin } = require('./modules');

router.use(express.urlencoded({ extended: true }));

//저장된 파일과 중복검사
const verifyIdMail = (id, mail) => {
    console.log(toVerify);
    let what = [id, mail].map(v => toVerify.has('ids', v));
    what = what.concat(what.some(v => v));
    return what;
};

const toVerify = {
    hash: new Map(),
    ids: new Set(),
    delete(hash, msg = 'mail 등록 중 완료!') {
        const { id, mail, set } = this.hash.get(hash);
        if (msg === 'mail 등록 중 완료!') clearTimeout(set);
        this.hash.delete(hash);
        this.ids.delete(id);
        this.ids.delete(mail);
        console.log(msg);
    },
    add(id, mail, hash) {
        const set = setTimeout(() => {
            this.delete(hash, 'mail 등록 취소');
        }, 5 * 60 * 1000);
        this.hash.set(hash, {set, id, mail });
        this.ids.add(id);
        this.ids.add(mail);
        console.log('mail 등록 중...');
    },
    has(type, value) {
        return this[type].has(value);
    },
};

//노드 메일러
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

router.get('/', (req, res) => {
    res.render('login');
}).get('/verify', async(req, res) => {
    //URI(URL과 유사)에서 id, mail
    const hash = decodeURIComponent(req.query.hash);
    const id = decodeURIComponent(req.query.id);
    const mail = decodeURIComponent(req.query.mail);
    //toVerify에 URI에 있던 hash값이 있다면,
    //toVerify hash값 지우고 파일에 정보저장
    if (toVerify.has('hash', hash)) {
        toVerify.delete(hash);
        await addUser(id, mail, hash);
        res.render('Success');
    } else res.render('error', { msg: '잘못된 접근' });
    //URI의 hash값이 toVerify에 없다면 정상적인 접근이 아니므로 잘못된 접근 출력
}).post('/verify', async(req, res) => {
    const { id, mail } = req.body;
    const what = verifyIdMail(id, mail);
    if (what[2]) {
        const obj = { status: 'bad', id: what[0], mail: what[1] };
        res.end(JSON.stringify(obj));
    } else {
        res.end('{"status":"good"}');
    }
}).get('/signup', async(req, res) => {
    res.render('SignUp')
}).post('/signup', async(req, res) => {
    const id = req.body.id;
    const pass = req.body.pass;
    const mail = req.body.email;
    const hash = makeHash(id, pass);
    const idDir = await fs.readdir('./login/id');
    const mailDir = await fs.readdir('./login/mail');
    const idMail = [mail, id];
    const result = [mailDir, idDir].map((v, i) => v.some(t => t === idMail[i]));
    //저장된 파일과 중복검사
    if (verifyIdMail(id, mail)[2]) {
        res.render('error', { msg: '이미 보낸 회원 정보입니다.' });
    } else if (result.some(v => v)) { //요청만 중복검사
        res.render('signup', { flag: `[${result.join(',')}]` });
    } else { //인증이메일 보내기
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
});

module.exports = router;