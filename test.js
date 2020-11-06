const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs/promises');
const crypto = require('crypto');
app.set('view engine', 'ejs');
class Rooms {
    static salt = 'whguswo';
    static #count = 0;
    static #arr = new Map();
    #num = 0;
    id = '';
    peoArr = new Set();
    constructor(){
        this.#num = Rooms.#count++;
        this.id = crypto.createHash('sha256').update(`${Rooms.salt}${this.#num}`).digest('base64');
        Rooms.#arr.set(this.id, this);
    }
    static getAll(type = 'obj'){
        if(type === 'id'){
            return [...Rooms.#arr].map(v => v[0]);
        } else return [...Rooms.#arr].map(v => v[1]);
    }
    static get(id){
        return Rooms.#arr.get(id);
    }
    static delete(id){
        return Rooms.#arr.delete(id);
    }
    join(id){
        this.peoArr.add(id);
    }
    separate(id){
        this.peoArr.delete(id);
    }
    get length(){
        return this.peoArr.size;
    }
}

app.get('/', (req, res) => {
    res.render('test');
}).get('*.(js|map)$', async (req, res) => {
    console.log(req.url);
    let result = await fs.readFile(`.${decodeURIComponent(req.url)}`);
    res.end(result);
});
const roomType = type => {
    if([/^대기실$/, /^방\d+$/].some(v => type.match(v))){
        return true;
    } else return false;
}
io.on('connection', socket => {
    socket.on('join', data => {
        if(roomType(data)) socket.join(data);
    });
});
http.listen(3000, () => {
    console.log('Test Server...');
});