const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name || "Oyuncu",
            team: data.team || "A",
            pos: { x: 0, y: 1.7, z: 0 },
            rot: { y: 0, p: 0 },
            health: 100
        };
        socket.emit('init', { id: socket.id, players });
        socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].pos = data.pos;
            players[socket.id].rot = data.rot;
            socket.broadcast.emit('updatePlayer', { id: socket.id, pos: data.pos, rot: data.rot });
        }
    });

    socket.on('hit', (data) => {
        const targetId = data.targetId;
        if (players[targetId] && players[targetId].team !== players[socket.id].team) {
            players[targetId].health -= 25;
            if (players[targetId].health <= 0) {
                players[targetId].health = 100;
                io.emit('playerDead', { victim: targetId, killer: socket.id, victimTeam: players[targetId].team });
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
