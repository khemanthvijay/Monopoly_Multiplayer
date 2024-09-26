let playerName = "";
let roomCode = "";
let ws;

function enterGame() {
    playerName = document.getElementById("playerName").value;
    console.log(playerName);
    if (playerName) {
        document.getElementById("nameInputDiv").classList.add("hidden");
        document.getElementById("optionsDiv").style.display = "flex";
        ws = new WebSocket('ws://' + window.location.host);
        ws.onmessage = handleServerMessages;
    } else {
        alert("Please enter your name.");
    }
}

function showPopup() {
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

function createRoom() {
    ws.send(JSON.stringify({ type: 'createRoom', playerName }));
    document.querySelector('button[onclick="createRoom()"]').style.display = "none";
    document.querySelector('button[onclick="joinRoom()"]').style.display = "none";
    document.getElementById("createRoomDiv").classList.remove("hidden");
}

function joinRoom() {
    document.querySelector('button[onclick="createRoom()"]').style.display = "none";
    document.querySelector('button[onclick="joinRoom()"]').style.display = "none";
    document.getElementById("joinRoomDiv").classList.remove("hidden");
}

function submitJoinCode() {
    const joinCode = document.getElementById("joinCode").value.toUpperCase();
    if (joinCode) {
        ws.send(JSON.stringify({ type: 'joinRoom', playerName, roomCode: joinCode }));
    } else {
        alert("Please enter a valid room code.");
    }
}

function startGame() {
    ws.send(JSON.stringify({ type: 'startGame', roomCode }));
}

function handleServerMessages(event) {
    const message = JSON.parse(event.data);

    switch (message.type) {
        case 'roomCreated':
            roomCode = message.roomCode;
            document.getElementById("roomCode").innerText = roomCode;
            updatePlayersList(message.players);
            break;

        case 'roomJoined':
            roomCode = message.roomCode;
            document.getElementById("waitingMessage").classList.remove("hidden");
            updatePlayersList(message.players);
            break;

        case 'playersUpdate':
            updatePlayersList(message.players);
            break;

        case 'startGame':
            document.getElementById("popup").style.display = "none";
            document.getElementById("gameBoardDiv").classList.remove("hidden");
            document.getElementById("mainContainer").classList.add("hidden");
            break;

        case 'error':
            document.getElementById("errorMessage").classList.remove("hidden");
            break;

        case 'redirect':
            // Redirect to game.html when the game starts
            window.location.href = message.url;
            console.log('redirct');
            localStorage.setItem('roomcode',roomCode);
            localStorage.setItem('playerName',playerName);
            break;
    }
}

function updatePlayersList(players) {
    const playerList = document.getElementById("playersList");
    playerList.innerHTML = '';
    players.forEach(player => {
        const playerItem = document.createElement("li");
        playerItem.innerText = player;
        playerList.appendChild(playerItem);
    });
}
