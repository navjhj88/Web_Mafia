const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const roomType = type => {
    if([/^대기실$/, /^[-A-Za-z0-9+/=]{44}$/].some(v => type.match(v))){
        return true;
    } else return false;
};

class Rooms {
    static salt = 'whguswo';
    static #arr = new Map();
    id = '';
    name = '';
    peoArr = new Set();
    constructor(name){
        this.name = name;
        this.id = crypto.createHash('sha256').update(`${this.name}${Rooms.salt}`).digest('base64');
        if(Rooms.#arr.has(this.id)){
            return false;
        } else {
            Rooms.#arr.set(this.id, this);
            return true;
        }
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
io.on('connection', socket => {
    socket.on('join', data => {
        if(roomType(data)) socket.join(data);
    });
    socket.on('makeRoom', data => {
        console.log(new Rooms(data));
    });
});

module.exports = { app, http };