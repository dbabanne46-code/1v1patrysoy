const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı: ' + socket.id);

    // Yeni oyuncuyu kaydet
    players[socket.id] = {
        pos: { x: 0, y: 1.7, z: 5 },
        rot: { y: 0, p: 0 },
        health: 100
    };

    // Bağlanan oyuncuya kendi ID'sini ve diğer oyuncuları bildir
    socket.emit('init', { id: socket.id, players });

    // Diğerlerine yeni birinin geldiğini söyle
    socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

    // Hareket verisi geldiğinde güncelle ve herkese yay
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].pos = data.pos;
            players[socket.id].rot = data.rot;
            socket.broadcast.emit('updatePlayer', { id: socket.id, pos: data.pos, rot: data.rot });
        }
    });

    // Ateş etme olayı
    socket.on('shoot', (data) => {
        socket.broadcast.emit('enemyShoot', { id: socket.id });
    });

    // Bağlantı kesildiğinde
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
        console.log('Oyuncu ayrıldı: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor. Arkadaşınla oynamak için IP adresini kullan!`);
});