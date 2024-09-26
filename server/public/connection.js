function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

class WebSocketManager {
    constructor() {
        this.socket = new WebSocket('ws://' + window.location.host);
        this.mainplayer = localStorage.getItem('playerName');
        this.roomCode = localStorage.getItem('roomcode');
        this.socket.onopen = () => {
            this.initialmessage(this.mainplayer,this.roomCode);
        };
        this.socket.onmessage = (event) => this.handleMessage(event);
    }

    sendMessage(data) {
        this.socket.send(JSON.stringify(data));
    }
    initialmessage(player, roomCode) {
        console.log(player, roomCode);
        if(roomCode && player){
            this.sendMessage({type:'readytobegin', player,roomCode});
            console.log('ready');
        }
        else{
            this.sendMessage({type:'notreadytobegin', player,roomCode});
            console.log('not ready');
        }
    }
    handleMessage(event) {
        console.log(event);
        const data = JSON.parse(event.data);
        //console.log(data);
        switch (data.type) {
            case 'gameInitialization':
                PlayerDisplayManager.updatePlayer(data.player);
                break;
            case 'removePlayer':
                PlayerDisplayManager.removePlayer(data.playerName);
                break;
            case 'gameMessage':
                PlayerDisplayManager.showMessage(data.message);
                break;
            // Handle other message types
        }
    }
}

class PlayerDisplayManager {
    static updatePlayer(player) {
        const playerDiv = document.getElementById(`player-${player.name}`) || PlayerDisplayManager.createPlayerDiv(player);
        playerDiv.querySelector('.cash-value').textContent = `$${player.money}`;
    }

    static createPlayerDiv(player) {
        const playerRow = document.querySelector('.player-row:last-child');
        const playerInfo = document.createElement('div');
        playerInfo.classList.add('player-info');
        playerInfo.id = `player-${player.name}`;
        playerInfo.innerHTML = `
            <span class="player-icon">${player.icon}</span>
            <span class="player-name">${player.name}</span>
            <span class="cash-value">$${player.money}</span>
        `;
        playerRow.appendChild(playerInfo);
        return playerInfo;
    }

    static removePlayer(playerName) {
        const playerDiv = document.getElementById(`player-${playerName}`);
        if (playerDiv) {
            playerDiv.querySelector('.player-name').style.opacity = '0.5'; // Make the name transparent
            // Optionally, you can add more logic to remove or hide the player div
        }
    }

    static showMessage(message) {
        // Implement the logic to show game messages or popups
    }
}


const wsManager = new WebSocketManager();
