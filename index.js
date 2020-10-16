const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const nodemailer = require('nodemailer');
const PORT = 3000;
const salt = 'whguswo';
const fs = require('fs/promises');
const toVerify = new Map();
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

app.set('view engine', 'ejs');

app.get('/', async(req, res) => {

    res.render('login');
});

app.get('/verify', async(req, res) => {
    const hash = req.query.hash;
    if (toVerify.has(hash)) {
        clearTimeout(toVerify.get(hash));
        await fs.writeFile(`./login/${hash}`, 'true', { encoding: 'utf-8' });
        res.render('SignUp');
    } else {
        res.end('<h1 style="color:red">잘못된 접근</h1>');
    }
})

app.post('/', (req, res) => {
    const id = req.body.id;
    const pass = req.body.pass;
    const hash = crypto.createHash('sha512').update(`${id}${salt}${pass}`).digest('base64');
    const set = setTimeout(() => {
        toVerify.delete(hash);
    }, 5 * 60 * 1000);
    toVerify.set(hash, set);
    let info = await transporter.sendMail({
        // 보내는 곳의 이름과, 메일 주소를 입력
        from: `"mafia" <webmafiamailer@gmail.com>`,
        // 받는 곳의 메일 주소를 입력
        to: req.body.email,
        // 보내는 메일의 제목을 입력
        subject: 'Test',
        // 보내는 메일의 내용을 입력
        // text: 일반 text로 작성된 내용
        // html: html로 작성된 내용
        html: `<h1>To Verify your account<br>Please, Click beleow link<br></h1><a href="localhost:3000/verify/?hash=${hash}">Verify</a>`,
    });
    console.log(info);
})

http.listen(PORT, () => {
    console.log('Running at ' + PORT);
})