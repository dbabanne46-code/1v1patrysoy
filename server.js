const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    // Yeni oyuncu canı 100 ile başlar
    players[socket.id] = {
        pos: { x: 0, y: 1.7, z: 5 },
        rot: { y: 0, p: 0 },
        health: 100
    };

    socket.emit('init', { id: socket.id, players });
    socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].pos = data.pos;
            players[socket.id].rot = data.rot;
            socket.broadcast.emit('updatePlayer', { id: socket.id, pos: data.pos, rot: data.rot });
        }
    });

    // VURULMA MANTIĞI
    socket.on('hit', (data) => {
        const targetId = data.targetId;
        if (players[targetId]) {
            players[targetId].health -= 20; // Her vuruş 20 hasar
            
            if (players[targetId].health <= 0) {
                players[targetId].health = 100; // Ölen kişi canı yenilenip doğar
                io.emit('playerDead', { victim: targetId, killer: socket.id });
            } else {
                io.emit('playerHit', { id: targetId, health: players[targetId].health });
            }
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });
});

http.listen(process.env.PORT || 3000, () => { console.log("Sunucu Aktif!"); });
