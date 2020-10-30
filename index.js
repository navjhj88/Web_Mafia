const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = 3000;
const fs = require('fs/promises');
const login = require('./login');

app.use('/login', login);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', async(req, res) => {
    res.redirect('/login');
});
//CSS보내주기
app.get('/*.(gif|css)', async(req, res) => {
    const url = decodeURI(req.url);
    console.log(`전:${req.url},후${url}`)
    const stylesheet = await fs.readFile(`.${url}`);
    if (url.match(/\.css$/)) {
        res.setHeader('Content-Type', 'text/css');
    }
    res.end(stylesheet);
});

http.listen(PORT, () => {
    console.log('Running at ' + PORT);
})