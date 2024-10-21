const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const Room = require('./handlers/room');
const Game = require('./handlers/maingame');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};
const games = {};

app.use(express.static('public'));

wss.on('connection', (ws) => {
    console.log('new client joined');
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'createRoom':
                handleCreateRoom(ws, data.playerName);
                break;
                
            case 'joinRoom':
                handleJoinRoom(ws, data.roomCode, data.playerName);
                break;
            case 'startGame':
                handleStartGame(data.roomCode);
                break;
            case 'readytobegin':
                const room = rooms[data.roomCode];
                //console.log(room);
                if(room){
                    room.updatePlayerWebSocket(data.player, ws);
                    if(!room.gameStarted) {
                room.readytobegin++;
                if(room.players.length == room.readytobegin){
                    const game = new Game(room);
                    //console.log(room.players);
                    games[data.roomCode] = game;
                    room.gameStarted = true;
                }}
                else {
                    if(room.gameStarted){
                        console.log('relaoded');
                        const game = games[room];
                        let state = game.handleReload();
                        room.sendToPlayer(data.player,state);
                    }
                }}
                break;
                //console.log(data);
            case 'notreadytobegin':
                console.log('not ready',data);
                break;
            case 'MainGameMessage':
                const game = games[data.roomCode]
                if(game){
                    switch (data.message) {
                        case 'rolledDice':
                            game.rollDice();
                            break;
                        case 'ClickedBuy':
                            game.buyProperty();
                            console.log('buy');
                            break;
                        case 'ClickedTrade':
                            game.tradeProperty();
                            break;
                        case 'ClickedDone':
                            game.ClickedDone();
                            break;
                        case 'ClickedWaitJail':
                            game.waitjail();
                            break;
                        case 'ClickedPayJail':
                            game.payjail();
                            break;
                        case 'TradeOffered':
                            game.handleTradeOffered(data);
                            break;
                        case 'SubmittingTrade':
                            game.submittingTrade(data);
                            break;
                        case 'declaredBankruptcy':
                            game.handleBankruptcy(data);
                            break;
                    }
                }
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        //handleDisconnection(ws);
    });
});

function handleCreateRoom(ws, playerName) {
    const roomCode = generateRoomCode();
    const room = new Room(roomCode);
    rooms[roomCode] = room;
    const player = room.addPlayer(ws, playerName);
    player.send({ type: 'roomCreated', roomCode, players: room.players.map(p => p.playerName) });
}

function handleJoinRoom(ws, roomCode, playerName) {
    const room = rooms[roomCode];
    if (room) {
        const player = room.addPlayer(ws, playerName);
        room.broadcast({ type: 'playersUpdate', players: room.players.map(p => p.playerName) });
        player.send({ type: 'roomJoined', roomCode, players: room.players.map(p => p.playerName) });
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    }
}

function handleStartGame(roomCode) {
    const room = rooms[roomCode];
    if (room) {
        room.startGame();
    }
}

function handleDisconnection(ws) {
    Object.values(rooms).forEach(room => {
        const player = room.players.find(p => p.ws === ws);
        if (player) {
            room.removePlayer(player);
            room.broadcast({ type: 'playersUpdate', players: room.players.map(p => p.playerName) });
            if (room.players.length === 0) {
                room.scheduleCleanup();
                delete rooms[room.roomCode];
            }
        }
    });
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
}

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
