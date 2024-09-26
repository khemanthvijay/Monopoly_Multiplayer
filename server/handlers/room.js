const Player = require('./player');

class Room {
    constructor(roomCode) {
        this.roomCode = roomCode;
        this.players = [];
        this.cleanupTimeout = null;
        this.readytobegin = 0;
        this.gameStarted = false;
    }

    addPlayer(ws, playerName) {
        const player = new Player(ws, playerName);
        this.players.push(player);
        return player;
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p !== player);
        if (this.players.length === 0) {
            //this.scheduleCleanup();
        }
    }

    scheduleCleanup() {
        if (this.cleanupTimeout) return;

        this.cleanupTimeout = setTimeout(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // 5 minutes
    }

    updatePlayerWebSocket(playerName, newWs) {
        Player.updateWebSocket(this.players, playerName, newWs);
    }

    cleanup() {
        clearTimeout(this.cleanupTimeout);
        this.cleanupTimeout = null;
        console.log(`Room ${this.roomCode} cleaned up.`);
    }

    startGame() {
        this.broadcast({
            type: 'redirect',
            url: '/game.html'
        });
    }
    broadcast(message) {
        this.players.forEach(player => player.send(message));
    }

    sendToPlayer(name, message) {
        let player = this.players.find(player =>player.playerName == name)
        player.send(message);
    }
}

module.exports = Room;
