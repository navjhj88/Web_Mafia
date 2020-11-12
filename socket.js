const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const waiting = io.of('/waiting');
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
    pass = '';
    #namespace = null;
    constructor(obj){
        this.name = obj.roomTitle;
        this.pass = obj.roomPass;
        this.id = Rooms.getIdByName(this.name);
        this.updateRoom('add');
        this.#namespace = io.of(`/${encodeURIComponent(this.id)}`);
        this.#namespace.on('connection', socket => {
            console.log('방 입장');
            socket.on('room', Rooms.roomPath);
            socket.on('disconnect', () => {
                if(this.#namespace.sockets.size === 0){
                    this.updateRoom('delete');
                    Rooms.delete(this.id);
                }
            });
        });
        if(Rooms.#arr.has(this.id)){
            throw Error('방 이름이 중복됩니다.');
        } else {
            Rooms.#arr.set(this.id, this);
            return true;
        }
    }
    get namespace(){
        return this.#namespace;
    }

    updateRoom(type){
        waiting.sockets.forEach(v => {
            const obj = {
                act : type,
                id : encodeURIComponent(this.id),
                name : this.name
            }
            v.emit('room', obj);
        });
    }
    static roomPath(data){
        // if(data.act === 'out'){
            
        // } else if(data.act === 'in'){
            
        // } else {
        //     return false;
        // }
    }
    static getIdByName(name){
        return crypto.createHash('sha256').update(`${name}${Rooms.salt}`).digest('base64');
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
}

waiting.on('connection', socket => {
    console.log('연결완료');
    socket.on('join', data => {
        if(roomType(data)) socket.join(data);
    });
    socket.on('room', Rooms.roomPath);
    socket.on('makeRoom', data => {
        try{

            console.log(data);
            new Rooms(data);
            socket.emit('ready', encodeURIComponent(Rooms.getIdByName(data.roomTitle)));
            // console.log(Rooms.getAll()[0].namespace);
        } catch(err){
            console.log(err);
        }
    });
});

module.exports = { app, http, Rooms };