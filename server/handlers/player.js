const WebSocket = require('ws');

class Player {
    constructor(ws, playerName) {
        this.ws = ws;
        this.playerName = playerName;
    }

    send(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    static updateWebSocket(players, playerName, newWs) {
        const player = players.find(p => p.playerName === playerName);
        if (player) {
            player.ws = newWs; // Update the ws reference
            console.log(`Updated WebSocket for player: ${playerName}`);
        } else {
            console.log(`Player not found: ${playerName}`);
        }
    }
}

module.exports = Player;
