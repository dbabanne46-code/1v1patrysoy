const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let players = {};
let scores = { RED: 0, BLUE: 0 };

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name.substring(0, 12),
            team: data.team,
            pos: { x: 0, y: 1.7, z: 0 },
            rot: { y: 0, p: 0 },
            health: 100
        };
        socket.emit('init', { id: socket.id, players, scores });
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
        const shooter = players[socket.id];
        if (players[targetId] && shooter && players[targetId].team !== shooter.team) {
            players[targetId].health -= 34; // 3 mermide öldürür
            if (players[targetId].health <= 0) {
                players[targetId].health = 100;
                scores[shooter.team]++;
                io.emit('playerDead', { 
                    victim: targetId, 
                    killer: socket.id, 
                    victimName: players[targetId].name,
                    killerName: shooter.name,
                    victimTeam: players[targetId].team,
                    scores: scores 
                });
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

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
