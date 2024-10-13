function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}


document.addEventListener("DOMContentLoaded", function () {
    let rotateEle = document.getElementById("rotate-message-id");
    let responEle = document.getElementById("responsive-id");
    let usercontrolEle = document.getElementById("controls-container-id");

    function checkOrientation() {
      if (window.innerWidth > window.innerHeight) {
        // Landscape orientation
        rotateEle.style.display = 'none';
        responEle.style.display = 'block';
        usercontrolEle.style.display = 'flex';
        // console.log("Landscape mode");
      } else {
        // Portrait orientation
        rotateEle.style.display = 'block';
        responEle.style.display = 'none';
        usercontrolEle.style.display = 'none';
        // console.log("Portrait mode");
      }
      // Print display properties to console
    //   console.log("rotateEle display: ", rotateEle.style.display);
    //   console.log("responEle display: ", responEle.style.display);
    //   console.log("usercontrolEle display: ", usercontrolEle.style.display);
     }

    // Initial check
    checkOrientation();

    // Listen for resize events to detect orientation changes
    window.addEventListener("resize", checkOrientation);
  });

class WebSocketManager {
    constructor() {
        this.socket = new WebSocket('ws://' + window.location.host);
        this.mainplayer = localStorage.getItem('playerName');
        this.roomCode = localStorage.getItem('roomcode');
        this.socket.onopen = () => {
            this.initialMessage(this.mainplayer, this.roomCode);
        };
        this.socket.onmessage = (event) => this.handleMessage(event);
        this.addEventListeners();
    }

    sendMessage(data) {
        this.socket.send(JSON.stringify(data));
    }

    initialMessage(player, roomCode) {
        console.log(player, roomCode);
        if (roomCode && player) {
            this.sendMessage({ type: 'readytobegin', player, roomCode });
            console.log('ready');
        } else {
            this.sendMessage({ type: 'notreadytobegin', player, roomCode });
            console.log('not ready');
        }
    }

    handleMessage(event) {
        console.log(event.data);
        const data = JSON.parse(event.data);
        const message = data.message;
        if (message.functionsToCall) {
            message.functionsToCall.forEach(func => {
                console.log('calling functions trure',message.functionsToCall);
                if (typeof PlayerDisplayManager[func] === 'function') {
                    PlayerDisplayManager[func](message);
                }
            });
        }
    }
    addEventListeners() {
        const diceElement = document.getElementById('sdice');
        const buyElement = document.getElementById('buy-card');
        const tradeElement = document.getElementById('sell-card');
        const doneElement = document.getElementById('done');
        diceElement.addEventListener('click', PlayerDisplayManager.DiceClicked);
        buyElement.addEventListener('click', PlayerDisplayManager.BuyClicked);
        doneElement.addEventListener('click', PlayerDisplayManager.DoneClicked);
        tradeElement.addEventListener('click', PlayerDisplayManager.TradeClicked);
    }
}



class PlayerDisplayManager {
    static button = "";
    static moved = null;
    static tradeIndex = 1;
    static TradeData = [];
    static tradeOffered = [];
    static displayMessage(data) {
        const docEle = document.getElementById('game-message');
        const diceEle = document.getElementById('sdice');
        const done = document.getElementById('done');
        const num = data.displayMessage[0];
        console.log("data.dis "+data.displayMessage[0]);
        if (num === 0) {
            setTimeout(() => {
                let upd = data.displayMessage[2].message.replace('num',  data.currentPlayer);
                docEle.innerHTML = upd;
                if(data.currentPlayer == wsManager.mainplayer){
                diceEle.style.display = "block";
                diceEle.style.pointerEvents = 'auto';  // Enable interaction
                diceEle.style.opacity = '1';
            }
            else{
                diceEle.style.display = "block";
                diceEle.style.pointerEvents = 'none';  // Disable interaction
                diceEle.style.opacity = '0.5';
            }
            }, 3000);
            docEle.innerHTML = data.displayMessage[1].message+wsManager.mainplayer;
        } else if (num === 1) {
            //console.log(data);
            let upd = data.displayMessage[1].replace('num', data.currentPlayerIndex);
            if(data.playerName == wsManager.mainplayer){
                let diceEle = document.getElementById('sdice');
                diceEle.style.display = "block";
                diceEle.style.pointerEvents = 'auto'; 
                diceEle.style.opacity = '1';
                console.log('true');
            }
                let doneEle = document.getElementById('done');
                doneEle.style.display="none";
                let buyEle = document.getElementById('buy-card');
                buyEle.style.display="none";
                let sellEle = document.getElementById('sell-card');
                sellEle.style.display="none";
                docEle.innerHTML = upd;
            } else if (num === 2) {
                if(wsManager.mainplayer == data.currentPlayer)
                    {
                        setTimeout(() => {
                            diceEle.style.display = "none";
                            done.style.display = "block";
                            document.getElementById('buy-card').style.display = "block";
                            document.getElementById('sell-card').style.display = "block";
                        }, 3000);
                        docEle.innerHTML = data.displayMessage[1].message;
                    }
                    else{
                        docEle.innerHTML = data.displayMessage[2].message;
                    }
                } else if (num === 3) {
                    diceEle.style.display = "none";
                    done.style.display = "none";
                    document.getElementById('sell-card').style.display = "block";
                    docEle.innerHTML = data.displayMessage;
                }
            }

    static DiceClicked() {
        console.log("Dice rolled!");
        wsManager.sendMessage({
            type: 'MainGameMessage',
            message: 'rolledDice',
            player: wsManager.mainplayer,
            roomCode: wsManager.roomCode
        });}

    static handleDiceMessage(data) {
        var dieSymbol1 = "&#" + (9855 + data.dice[0]) + ";";
        var dieSymbol2 = "&#" + (9855 + data.dice[1]) + ";";
        const diceElement = document.getElementById('sdice');
        diceElement.classList.add('fade-in');
        diceElement.innerHTML = dieSymbol1+dieSymbol2;
        setTimeout(() => {
                diceElement.classList.remove('fade-in');
            }, 3000);
    }
    static dynamicEventListenersjail(){
        document.getElementById('payjail').addEventListener('click', this.clickedPayjail.bind(this));
        document.getElementById('waitjail').addEventListener('click', this.clickedWaitjail.bind(this));
    }
    static placePLayerIcons(data) {
        console.log('placing icons');
        const container = document.getElementById('icon-position-1');
        data.playersData.forEach((player, index) => {
            const playerIcon = document.createElement('h3');
            playerIcon.id = `player-icon-${index + 1}`;
            playerIcon.style.fontSize = '2.5vw';
            playerIcon.style.color = player.color;
            playerIcon.innerHTML = player.icon;
            container.appendChild(playerIcon);
        });
    }

    static displayPlayerMoney(data) {
//         let players = Array.isArray(data.playersData) ? data.playersData : [data.playersData];
//         players.forEach(player => {
//         const playerDiv = document.getElementById(`player-${player.playerName}`) || PlayerDisplayManager.createPlayerDiv(player);
//         playerDiv.querySelector('.cash-value').textContent = `$${player.money}`;
// });

        data.playersData.forEach(player => {
            const playerDiv = document.getElementById(`player-${player.playerName}`) || PlayerDisplayManager.createPlayerDiv(player);
            playerDiv.querySelector('.cash-value').textContent = `$${player.money}`;
        });
    }

    static createPlayerDiv(player) {
        const playerRow = PlayerDisplayManager.getOrCreatePlayerRow();
        const playerInfo = document.createElement('div');
        playerInfo.classList.add('player-info');
        playerInfo.id = `player-${player.playerName}`;
        playerInfo.innerHTML = `
            <span class="player-icon">${player.icon}</span>
            <span class="player-name">${player.playerName}</span>
            <span class="cash-value">$${player.money}</span>
        `;
        playerRow.appendChild(playerInfo);
        return playerInfo;
    }

    static getOrCreatePlayerRow() {
        const playerContainer = document.getElementById('players-container');
        let lastRow = playerContainer.querySelector('.player-row:last-child');
        if (!lastRow || lastRow.children.length >= 2) {
            lastRow = document.createElement('div');
            lastRow.classList.add('player-row');
            playerContainer.appendChild(lastRow);
        }
        return lastRow;
    }

    static updatePlayerOpacity(playerName, opacity) {
        const playerDiv = document.getElementById(`player-${playerName}`);
        if (playerDiv) {
            playerDiv.style.opacity = opacity;
        }
    }
    static clickedPayjail() {
        console.log('clicked pay jail');
        wsManager.sendMessage({
            type: 'MainGameMessage',
            message: 'ClickedPayJail',
            player: wsManager.mainplayer,
            roomCode: wsManager.roomCode
        });    
    }
    static clickedWaitjail() {
        console.log('clicked wait jail');
        wsManager.sendMessage({
            type: 'MainGameMessage',
            message: 'ClickedWaitJail',
            player: wsManager.mainplayer,
            roomCode: wsManager.roomCode
        });
        this.clearpopup();    
    }
    static movePlayerAnimation(data) {
        this.moved = new Promise((resolve) => {
        console.log(1);
        let playerIndex = data.move[0];
        let prevPosition = data.move[1];
        let newPosition = data.move[2];
        console.log(playerIndex, prevPosition, newPosition);
        var steps = newPosition - prevPosition;
        var nextPosElement = document.getElementById(`icon-position-${newPosition}`);
        var playerIconElement = document.getElementById(`player-icon-${playerIndex}`);
        const jumpCount = 5; // Number of jumps
        const jumpHeight = 20; // Height of each jump
        for (let i = 1; i <= steps; i++) {
            setTimeout(() => {
                let nextBoxNumber = prevPosition + i;
                let nextBox = document.getElementById(`icon-position-${nextBoxNumber}`);
                let nextBoxPosition = nextBox.getBoundingClientRect();
                let currentBoxPosition = document.getElementById(`icon-position-${prevPosition}`).getBoundingClientRect();
        
                let offsetX = nextBoxPosition.left - currentBoxPosition.left;
                let offsetY = nextBoxPosition.top - currentBoxPosition.top;
        
                playerIconElement.style.transform = `translate(${offsetX}px, ${offsetY}px) translateY(-${jumpHeight}px)`;
            }, i * 200);
        }
        setTimeout(() => {
            // Get all div elements with class 'player-icon-${playerIndex}' inside prevPosElement
            const playerIconElements = document.getElementById(`player-icon-${playerIndex}`);
            // Remove each div element with class 'player-icon-${this.playerIndex}'
            playerIconElements.parentNode.removeChild(playerIconElements);
            const playerIcon = document.createElement('h3');
            // Player ID starting from 1
            playerIcon.id = `player-icon-${playerIndex}`;
            playerIcon.style.fontSize = '2.5vw';
            playerIcon.style.color = data.playersData.color; // Assuming player has a color property
            playerIcon.innerHTML = data.playersData.icon; // Assuming player.icon contains the character
            nextPosElement.appendChild(playerIcon);
            resolve(); 
        }, (steps + jumpCount) * 200); // Total animation duration
        });
        }

        static clearpopup(){
            let popupEle = document.getElementById('popupcontainer');
            popupEle.style.display = "none";
            let heading = document.getElementById('heading-popupcontainer');
            heading.innerHTML="";
            const parentElement = document.getElementById('popup-dynamic');
            parentElement.innerHTML = "";
          }
    

        static handlepopup(data) {
        let type = data.handlepopupData[0];
        let head = data.handlepopupData[1];
        let msg = data.handlepopupData[2];
            //console.log("message "+head);
        let popupEle = document.getElementById('popupcontainer');
        let heading = document.getElementById('heading-popupcontainer');
        let parentElement = document.getElementById('popup-dynamic');
        if(popupEle.style.display == "block")
            this.clearpopup();
        popupEle.style.display = "block";
      if(type == 'buycard'){
        setTimeout(() => {
          this.clearpopup();
        }, 3000);
         console.log(msg, msg.property, msg[1]);
        heading.textContent = head+msg[0].property[0];
        this.addBuyIcon(data.handlepopupData);
        // Create the HTML content
      const cardContent = `
          <div class="card" id="card-popup">
              <h4 class="cheading-popup"></h4>
              <div class="line"></div>
              <div class="box-text">
                  <span class="text">Rent</span>
                  <span class="text-Rent-popup"></span>
              </div>
              <div class="house">
                  <span class="house-text">&#127968; - </span>
                  <span class="house-value-1-popup"></span>
              </div>
              <div class="house">
                  <span class="house-text">&#127968;&#127968; - </span>
                  <span class="house-value-2-popup"></span>
              </div>
              <div class="house">
                  <span class="house-text">&#127968;&#127968;&#127968; - </span>
                  <span class="house-value-3-popup"></span>
              </div>
              <div class="box-closecard">
                  <button class="close-cardshow" onclick="closecard()">Close</button>
              </div>
          </div>`;
        // card display set to none
      // Add the card content to the parent element
            parentElement.innerHTML = '';
            // var text = cards[players[playerIndex-1].position][0];
            // console.log(cards[players[playerIndex-1].position][0]);
            // let s = document.getElementById('card-popup');
            // s.style.display='block';
            // var elements = document.querySelector(".cheading-popup");
            // let v=cards[players[playerIndex-1].position][1];
            // console.log(v);
            // elements.textContent=text+' '+'-'+' '+v;
            // var re = document.querySelector(".text-Rent-popup");
            // re.textContent = (v/100)*10;
            // let h1=document.querySelector('.house-value-1-popup');
            // h1.textContent = (v/100)*20;
            // let h2=document.querySelector('.house-value-2-popup');
            // h2.textContent = (v/100)*30;
            // let h3=document.querySelector('.house-value-3-popup');
            // h3.textContent = (v/100)*40;
      }
      else if(type == 'rent'){
        setTimeout(() => {
        this.clearpopup();
        }, 3000);
        heading.textContent= head;
        parentElement.innerHTML = msg;
        //console.log('rent')
      }
      else if(type == 'income tax'|| type== 'chance'||type=='chest'||type == 'club'||type == 'other'||type == 'unlucky'){
        setTimeout(() => {
          this.clearpopup();
        }, 3000);
        if(type == 'unlucky')
         {  //let data = { 
        //     displayMessage: [
        //         {}, // Placeholder for index 0
        //         {}, // Placeholder for index 1
        //         { message: 'Click done to end turn' } // Index 2 with the message
        //     ]
        // };
        //     this.displayMessage(data.displayMessage[2].message)
        }
        heading.textContent = head;
        parentElement.innerHTML = msg;
      }
      else if(type == 'jail'){
        heading.textContent=head;
        let cont ='<div style="display: flex;"><button id="payjail">Pay 200</button><button id="waitjail">Wait Until 6</button></div>';
        parentElement.innerHTML = cont;
        this.dynamicEventListenersjail();
      }
      else if(type == 'trade'){
        heading.textContent = head;
        //let selectedplayer = ;
        let tradecont = `    <!-- Trade initiation form -->
      <div id="tradeForm">
          <div class="playerDisplay">
              <button id="prevTradePlayer" >&lt;</button>
              <span id="currentPlayer"></span>
              <button id="nextTradePlayer" >&gt;</button>
          </div>
      
          <div class="cardsSection">
              <label for="playerCards">Your cards:</label>
              <select id="playerCards"multiple>
                  <!-- Options populated dynamically with player's cards -->
              </select>
          </div>
      
          <div class="cardsSection">
              <label for="requestedCards">Other player's cards:</label>
              <select id="requestedCards" multiple>
                  <!-- Options populated dynamically with other player's cards -->
              </select>
          </div>
      
          <div class="moneySection">
              <label for="moneyOffered">Send Money:</label>
              <input type="range" id="moneyOffered" min="0" max="1000" value="0">
              <output for="moneyOffered" id="moneyOfferedValue">0</output>
      
              <label for="moneyRequested">Request Money:</label>
              <input type="range" id="moneyRequested" min="0" max="1000" value="0">
              <output for="moneyRequested" id="moneyRequestedValue">0</output>
          </div>
      
          <button id="submittrade">Initiate Trade</button>
          <button id = "canceltrade">Cancel</button>
      </div>`;
      parentElement.innerHTML = tradecont;
      }
      else if(type == 'tradeoffered'){
        heading.textContent = head;
        let tradeofferedcont = `<div id="tradeOfferDisplay">
              <strong>Offered Cards:</strong>
              <div id="offeredCardsContainer">
                  <!-- Offered cards will be dynamically added here -->
              </div>
              <strong>Requested Cards</strong>
              <div id ="requestedCardsContainer"></div>
          </div>
          <div>
              <strong>Offered Money:</strong> <span id="offeredMoney"></span>
          </div>
          <div>
              <strong>Requested Money:</strong> <span id="requestedMoney"></span>
          </div>
          <button id="acceptBtn">Accept</button>
          <button id="rejectBtn">Reject</button>
      </div>`;
      parentElement.innerHTML = tradeofferedcont;
      }
      else if(type == 'lessmoney'){
        heading.textContent = head;
        let lessmoneycont = `<div><button id="repaybank">Repay</button><button id="bankruptcy">Declare Bankruptcy</button></div>`;
        parentElement.innerHTML = lessmoneycont;
      }
      else if(type == 'gamewon'){
        heading.textContent = head;
        parentElement.innerHTML ='';
      }
        }
        static DoneClicked() {
            if(!PlayerDisplayManager.button != 'done'){
            wsManager.sendMessage({
                type: 'MainGameMessage',
                message: 'ClickedDone',
                player: wsManager.mainplayer,
                roomCode: wsManager.roomCode
            })
            PlayerDisplayManager.button = 'done';
        }
        }
        static BuyClicked() {
            console.log(PlayerDisplayManager.button);
            if(PlayerDisplayManager.button != 'buy'){
            console.log('clicked buy');
            wsManager.sendMessage({
                type: 'MainGameMessage',
                message: 'ClickedBuy',
                player: wsManager.mainplayer,
                roomCode: wsManager.roomCode
            });
            PlayerDisplayManager.button = 'buy';
        }
        }
        static TradeClicked() {
            wsManager.sendMessage({
                type: 'MainGameMessage',
                message: 'ClickedTrade',
                player: wsManager.mainplayer,
                roomCode: wsManager.roomCode
            });
            let data = {"handlepopupData":['trade','Trade with Players',""]};
            PlayerDisplayManager.handlepopup(data);
            PlayerDisplayManager.addEventListenersTrade();
        }
        static addEventListenersTrade() {
            document.getElementById('nextTradePlayer').onclick = () => {
                this.changePlayerTrade(1); 
            };
            
            document.getElementById('prevTradePlayer').onclick = () => {
                this.changePlayerTrade(-1);
            }
            document.getElementById('submittrade').onclick = () => {
                this.submittrade();
            }
            document.getElementById('canceltrade').onclick = () => {
                this.clearpopup();
            }
        }
        static showTrade(data) {
            this.TradeData = data;
            console.log("index "+this.tradeIndex);
            document.getElementById('currentPlayer').innerText = data.players[this.tradeIndex].playerName;
            let playerCardsDropdown = document.getElementById('playerCards');
            playerCardsDropdown.innerHTML = '';
            let emptyOption = document.createElement('option');
            emptyOption.text = "select card";
            emptyOption.value = ""; // Optionally, you can set a value for the empty option
            playerCardsDropdown.add(emptyOption, 0);
            data.playersCards[data.currentPlayer[1]].forEach(card => {   
                let option = document.createElement('option');
                option.text = card;
                //console.log(this.players[this.playerIndex-1].cards);
                playerCardsDropdown.add(option);
              });
              let tradeWithPlayerCardsDropdown = document.getElementById('requestedCards');
              tradeWithPlayerCardsDropdown.innerHTML = '';
              let empty = document.createElement('option');
              empty.text = "select card";
              empty.value = ""; // Optionally, you can set a value for the empty option
              tradeWithPlayerCardsDropdown.add(empty, 0);
              data.playersCards[this.tradeIndex].forEach(card => {
                let option = document.createElement('option');
                option.text = card;
                tradeWithPlayerCardsDropdown.add(option);
              });
              document.getElementById('moneyOffered').addEventListener('input', function() {
                document.getElementById('moneyOfferedValue').innerText = this.value;
                document.getElementById('moneyOffered').max = data.playersMoney[data.currentPlayer[1]];
                });
                document.getElementById('moneyRequested').addEventListener('input', function() {
                document.getElementById('moneyRequestedValue').innerText = this.value;
                 });
                 this.tradeOffered.splice(0, this.tradeOffered.length);
                 this.tradeOffered.push({
                  "offeredto":[this.tradeIndex,data.players[this.tradeIndex].playerName]
                 })
        }

        static handleTradeOffering(message) {
            let data = message.data;
            let popup = {"handlepopupData":['tradeoffered', 'Trade Offer']};
            PlayerDisplayManager.handlepopup(popup);
            let offeredCardsContainer = document.getElementById('offeredCardsContainer');
            offeredCardsContainer.innerHTML = '';
    
            let validOfferedCards = data[1].offeredCards.filter(card => card !== "select card");
    
            if (validOfferedCards.length > 0) {
                validOfferedCards.forEach(card => {
                    let cardElement = document.createElement('div');
                    cardElement.textContent = card;
                    offeredCardsContainer.appendChild(cardElement);
                });
            } else {
                let messageElement = document.createElement('div');
                messageElement.textContent = "No cards offered.";
                offeredCardsContainer.appendChild(messageElement);
            }
    
            let requestedCardsContainer = document.getElementById('requestedCardsContainer');
            requestedCardsContainer.innerHTML = '';
    
            let validRequestedCards = data[1].requestedCards.filter(card => card !== "select card");
    
            if (validRequestedCards.length > 0) {
                validRequestedCards.forEach(card => {
                    let cardElement = document.createElement('div');
                    cardElement.textContent = card;
                    requestedCardsContainer.appendChild(cardElement);
                });
            } else {
                let messageElement = document.createElement('div');
                messageElement.textContent = "No cards requested.";
                requestedCardsContainer.appendChild(messageElement);
            }
    
            document.getElementById('offeredMoney').innerText = data[1].moneyOffered;
            document.getElementById('requestedMoney').innerText = data[1].moneyRequested;
            document.getElementById('acceptBtn').addEventListener('click', () => {
                //console.log(this.tradeData);
                let validOfferedCards = data[1].offeredCards.filter(card => card !== "select card");
                let validRequestedCards = data[1].requestedCards.filter(card => card !== "select card");
                let offferedData = [validOfferedCards,validRequestedCards,data[1].moneyOffered,data[1].moneyRequested];
                let offeredto = data[0].offeredto[0];

                wsManager.sendMessage({
                    type: 'MainGameMessage',
                    message: 'SubmittingTrade',
                    player: wsManager.mainplayer,
                    roomCode: wsManager.roomCode,
                    data: offferedData,
                    offeredto:offeredto
                });
                
                // Assuming tradeData contains information about the trade and updated ownership
                data[1].offeredCards.forEach(cardName => {
                     // Assuming you have a function to retrieve card object by name
                    if (cardName) {
                        //this.addBuyIcon(cardName);
                        // console.log('updated offered');
                    }
                });
                data[1].requestedCards.forEach(cardName => {
                   
                    if (cardName) {
                        //this.addBuyIcon(cardName);
                        // console.log('upated icon requested');
                    }
                });

                this.clearpopup();
            });
    
            document.getElementById('rejectBtn').addEventListener('click', () => {
                data = [];
                this.TradeData =[];
                // console.log('cleared ' + data);
                this.clearpopup();
            });
            // this.players.forEach(player => {
            //      console.log(`Player ${player.id} cards:`, player.cards);
            // });
        }
        static submittrade(){
            let moneyOffered = parseInt(document.getElementById('moneyOffered').value);
              let moneyRequested = parseInt(document.getElementById('moneyRequested').value);
              let offeredCards = [];
              let requestedCards = [];
          
              // Get offered cards
              let selectedCardsDropdown = document.getElementById('playerCards');
              for (let option of selectedCardsDropdown.options) {
                  if (option.selected) {
                      offeredCards.push(option.text);
                  }
              }
          
              // Get requested cards
              let requestedCardsDropdown = document.getElementById('requestedCards');
              for (let option of requestedCardsDropdown.options) {
                  if (option.selected) {
                      requestedCards.push(option.text);
                  }
              }
          
              // Push all data into the tradeData array
              //console.log(offeredCards+" "+requestedCards);
              if(offeredCards != "select card" || requestedCards != "select card"){
              this.tradeOffered.push({
                  "offeredCards": offeredCards,
                  "requestedCards": requestedCards,
                  "moneyOffered": moneyOffered,
                  "moneyRequested": moneyRequested
              });
              console.log(this.tradeOffered);
              setTimeout(() => {
                wsManager.sendMessage({
                    type: 'MainGameMessage',
                    message: 'TradeOffered',
                    player: wsManager.mainplayer,
                    roomCode: wsManager.roomCode,
                    data:this.tradeOffered
                })
              }, 2000);}
              else{
                alert('Trade is invalid');
              }
              this.clearpopup();
          }

        static changePlayerTrade(index) {
            this.tradeIndex = (this.tradeIndex + index < 0 || this.tradeIndex + index >= this.TradeData.players.length)? ((this.tradeIndex + index < 0) ? this.TradeData.players.length - 1 : 0): this.tradeIndex + index;
            if (this.tradeIndex !== this.TradeData.currentPlayer[1]) 
                this.showTrade(this.TradeData);
            //console.log(this.tradeIndex);
            }
        static async handleChangePosition(data) {
            await this.moved;
            let playerIndex = data.currentPlayerIndex;
            let currentPlayer = data.playersData;
            let newpos = data.changePositionData;
        const playerIconElement = document.getElementById(`player-icon-${playerIndex}`);
        if (playerIconElement) {
            playerIconElement.remove();
        }
        console.log(2,playerIconElement, playerIndex, newpos);
        const playerIcon = document.createElement('h3');
        playerIcon.id = `player-icon-${playerIndex}`;
        playerIcon.style.fontSize = '2.5vw';
        playerIcon.style.color = currentPlayer.color;
        playerIcon.innerHTML = currentPlayer.icon;
        const nextPosElement = document.getElementById(`icon-position-${newpos}`);
        if(nextPosElement){
            nextPosElement.appendChild(playerIcon);
        }
        console.log('end');
        }
        static changeBuyIcon(data) {
            let cardDataArray = data.data;
            console.log(data.data);
            // Iterate through each card's data and call addBuyIcon one by one
            cardDataArray.forEach(cardData => {
                let propertyData = [
                    {}, // Index 0 (empty)
                    {}, // Index 1 (empty)
                    [
                        { property: cardData.property }, // Property details at index 2[0]
                        cardData.color                    // Color at index 2[1]
                    ]
                ];
                
                // Call addBuyIcon with the formatted data
                this.addBuyIcon(propertyData);
            });
        }

        static addBuyIcon(data) {
            let color = data[2][1];
            let property = data[2][0].property;
            console.log('adding icon',property);
            if(property[1] <= 10){
            const container = document.getElementById("icon-position-" + property[1]);
            const playerIconN = document.createElement("div");
            playerIconN.classList.add("playericon-n");
            playerIconN.style.backgroundColor = color;
            container.appendChild(playerIconN);}
            else if(property[1] > 10 && property[1] <= 20){
                const container = document.getElementById("icon-position-" + property[1]);
                const playerIconN = document.createElement("div");
                playerIconN.classList.add("playericon-n");
                playerIconN.style.backgroundColor = color;
                playerIconN.style.transform = 'rotate(90deg)';
                playerIconN.style.top = '40%';
                playerIconN.style.left = '93%';
                container.appendChild(playerIconN);
            }
            else if(property[1] > 20 && property[1] <= 30){
                const container = document.getElementById("icon-position-" + property[1]);
                const playerIconN = document.createElement("div");
                playerIconN.classList.add("playericon-n");
                playerIconN.style.backgroundColor = color;
                playerIconN.style.transform = 'rotate(180deg)';
                playerIconN.style.top = '100%';
                playerIconN.style.left = '40%';
                container.appendChild(playerIconN);
            }
            else if(property[1] > 30 && property[1] <= 40){
                const container = document.getElementById("icon-position-" + property[1]);
                const playerIconN = document.createElement("div");
                playerIconN.classList.add("playericon-n");
                playerIconN.style.backgroundColor = color;
                playerIconN.style.transform = 'rotate(270deg)';
                playerIconN.style.top = '40%';
                playerIconN.style.left = '-16%';
                container.appendChild(playerIconN);
            }
        }
    }

const wsManager = new WebSocketManager();
