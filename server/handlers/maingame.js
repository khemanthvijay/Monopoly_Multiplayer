class GamePlayer {
    constructor(player, id, icon, color) {
        this.playerName = player.playerName;
        this.playerID  = id;
        this.icon = icon;
        this.position = 1; // Start position on the board
        this.color = color;
        this.jail = [false, 0];
        this.money = 1000;
        this.cards = [];
        this.bankrupt = false;
    }
    addSubMoney(isAdd, amount, gameInstance) {
        if (!isAdd) {
            this.money += amount;
        } else {
            this.money -= amount;
        }
        let message = {functionsToCall : ['displayPlayerMoney'],
            playersData:[{playerName:this.playerName,money: this.money}],
        }
        if(gameInstance){
            console.log(this.playerName, {type: 'UpdateMoney', message});
            gameInstance.broadcast({type: 'UpdateMoney', message});
        }
        else{
            console.log('empty',gameInstance)
        }
       //this.send(message,gameInstance);
    }

    send(message, gameInstance) {
        if (gameInstance){
            if(typeof gameInstance.sendToPlayer === 'function') {
            gameInstance.sendToPlayer(this.playerName, message);
        } else {
            console.error("gameInstance or sendToPlayer method is undefined.");
        }}
        else{
            console.log(gameInstance);
        }
    }
}

class Property {
    constructor(name, price, position, group = null) {
        this.name = name;
        this.price = price;
        this.position = position;
        this.group = group; // Property group (e.g., 1 for Brown, 0 for Railroad, -1 for Utility)
        this.owner = null;
    }

    buy(player, gameInstance) {
        if (player.money >= this.price && !this.owner) {
            player.addSubMoney(true, this.price, gameInstance);
            this.owner = player.playerID;
            player.cards.push(this.name);
            return true;
        }
        return false;
    }

    payRent(player, gameInstance, rolled) {
        if (this.owner && this.owner !== player.id) {
            let rent = 0;
            const ownerPlayer = gameInstance.getPlayerById(this.owner);
            console.log(ownerPlayer, this.owner);
            if (this.group > 0) {
                const propertiesInGroup = gameInstance.properties.filter(property => property.group === this.group);
                const ownerPropertiesInGroup = propertiesInGroup.filter(property => property.owner === this.owner);
                console.log(ownerPropertiesInGroup);
                if (ownerPropertiesInGroup.length === propertiesInGroup.length) {
                    rent = parseInt((this.price / 100) * 80); // Higher rent for owning all properties in group
                } else {
                    rent = parseInt((this.price / 100) * 20); // Base rent
                }
            } else if (this.group === 0) {
                const ownerRailroads = gameInstance.properties.filter(property => property.group === 0 && property.owner === this.owner).length;
                rent = 50 * ownerRailroads; // $50 rent per owned railroad
            } else if (this.group === -1) {
                const ownerUtilities = gameInstance.properties.filter(property => property.group === -1 && property.owner === this.owner).length;
                rent = ownerUtilities === 1 ? 4 * rolled : 10 * rolled; // Rent based on dice roll
            }

            player.addSubMoney(true, rent, gameInstance.room);
            ownerPlayer.addSubMoney(false, rent, gameInstance.room);

            gameInstance.handlepopup('rent', `Rent Paid ${rent} by Player ${player.playerID}`, `<div style='display: flex;'>
                <p style="font-size: 4rem;">${player.icon}</p>
                <p style="font-size: 55px;">&#x2192;</p>
                <p style="font-size: 4rem;">${ownerPlayer.icon}</p>
            </div>`);

            return true;
        }
        return false;
    }
}


class SpecialCard {
    constructor(name, position) {
        this.name = name;
        this.position = position;
    }
}

class Game {
    constructor(room) {
        this.room = room; // Store the Room instance
        this.icons = ['♙','♗','♘','♖']; // Example player icons
        this.color = ['red','blue','green','yellow'];
        this.players = room.players.map((player, index) => {
            let id = index+1;
            const icon = this.icons[index % this.icons.length]; // Assign icons in a round-robin fashion
            const color = this.color[index % this.color.length]; // Assign colors in a round-robin fashion
            return new GamePlayer(player,id, icon, color);
        });
        this.gameState = [];
        this.isRolling = false;
        this.messagePlayer = ["Welcome To Game ",'Player num Roll Dice!!',"Click done to end turn","Repay to bank"];
        this.playerIndex = 1;
        this.max_container = 40;
        this.indexChange = 2;
        this.tradeData = [];
        this.properties = [
            new Property('Mediterranean Avenue', 60, 2, 1),
            new Property('Baltic Avenue', 60, 4, 1),
            new Property('Reading Railroad', 200, 6, 0),
            new Property('Oriental Avenue', 100, 7, 2),
            new Property('Vermont Avenue', 100, 9, 2),
            new Property('Connecticut Avenue', 120, 10, 2),
            new Property('St. Charles Place', 140, 12, 3),
            new Property('Electric Company',150, 13, -1),
            new Property('States Avenue', 140, 14, 3),
            new Property('Virginia Avenue', 160, 15, 3),
            new Property('Pennsylvania Railroad', 200, 16, 0),
            new Property('St. James Place', 180, 17, 4),
            new Property('Tennessee Avenue', 180, 19, 4),
            new Property('New York Avenue', 200, 20, 4),
            new Property('Kentucky Avenue', 220, 22, 5),
            new Property('Indiana Avenue', 220, 24, 5),
            new Property('Illinois Avenue', 240, 25, 5),
            new Property('B. & O. Railroad', 200, 26, 0),
            new Property('Atlantic Avenue', 260, 27, 6),
            new Property('Ventnor Avenue', 260, 28, 6),
            new Property('Water Works', 150, 29, -1),
            new Property('Marvin Gardens', 280, 30, 6),
            new Property('Pacific Avenue', 300, 32, 7),
            new Property('North Carolina Avenue', 300, 33, 7),
            new Property('Pennsylvania Avenue', 320, 35, 7),
            new Property('Short Line', 200, 36, 0),
            new Property('Park Place', 350, 38, 8),
            new Property('Boardwalk', 400, 40, 8)
        ];
        this.specialCards = [
            new SpecialCard('Go', 1),
            new SpecialCard('Community Chest', 3),
            new SpecialCard('Income Tax', 5),
            new SpecialCard('Chance', 8),
            new SpecialCard('Just Visiting', 11),
            new SpecialCard('Jail', 45),
            new SpecialCard('Community Chest', 18),
            new SpecialCard('Free Parking', 21),
            new SpecialCard('Chance', 23),
            new SpecialCard('Go to Jail', 31),
            new SpecialCard('Community Chest', 34),
            new SpecialCard('Chance', 37),
            new SpecialCard('Luxury Tax', 39)
        ];

        this.isGameActive = false;
        this.startGame();
    }

    startGame() {
        this.isGameActive = true;
        console.log(this.players);
        this.initilazation();
    }

    initilazation() {
        let playersData = this.players.map(player => ({
            playerName: player.playerName,
            icon: player.icon,
            money: player.money,
            position: player.position,
            color: player.color
        }));
        let message ={displayMessage : [0,{message:this.messagePlayer[0]},{message :this.messagePlayer[1]}],
            functionsToCall : ['placePLayerIcons','displayPlayerMoney','displayMessage'],
            currentPlayer : this.players[this.playerIndex-1].playerName,
            playersData : playersData
        };
        console.log(message);
        if (this.room) {
            this.room.broadcast({type: 'gameInitialization', message}); // Broadcast message to all players in the room
            this.gameState = {type: 'gameInitialization', message};
        } else {
            console.error(`Room not found.`);
        }
        // let one = ['Oriental Avenue', 'Vermont Avenue', 'Connecticut Avenue'];
        // let two = ['St. Charles Place','States Avenue','Virginia Avenue'];
        // // Set the owner of the properties in 'one' to 1 and add them to player 0's cards
        // this.properties.forEach(property => {
        //     if (one.includes(property.name)) {
        //         property.owner = 1; // Set owner to player 1 (ID = 1)
        //         this.players[0].cards.push(property.name); // Add property to player 0's cards
        //         }});
        // this.properties.forEach(property => {
        //     if (two.includes(property.name)) {
        //         property.owner = 2; // Set owner to player 1 (ID = 1)
        //         this.players[1].cards.push(property.name); // Add property to player 0's cards
        //         }});
    }

    rollDice() {
        if (this.isRolling) {
            return; // Prevent multiple clicks while animation is playing
        }
        this.isRolling = true;
        var random1 = Math.floor((Math.random() + Date.now()) % 1 * 6) + 1;// Generate a random number between 1 and 6
        var random2 = Math.floor((Math.random() + Date.now()) % 1 * 6) + 1; // Generate a random number between 1 and 6
        this.movePlayer(random1,random2);
       }
       
       movePlayer(random1,random2) {
        let player = this.players[this.playerIndex - 1];
        let playersData = {
            playerName: player.playerName,
            icon: player.icon,
            money: player.money,
            position: player.position,
            color: player.color
        };
        let message = {
            functionsToCall: ['handleDiceMessage', 'displayMessage'],
            currentPlayer: this.players[this.playerIndex-1].playerName,
            displayMessage: [2, {message: this.messagePlayer[2]}, {message: `Player ${this.playerIndex} has rolled ${random1 + random2}`}],
            dice: [random1, random2],
            playersData: playersData
        };
        let prevPosition = this.players[this.playerIndex-1].position;
        let newPosition = 0;
        let total = random1+random2;
        if(prevPosition == 45 && this.players[this.playerIndex-1].jail[0]){
            //console.log('sent to handlejaol'+this.players[this.playerIndex-1].jail[0]);
            this.handlejailwait(total);
          }
          else{
            if(prevPosition+total > this.max_container){
              // this.players[playerIndex-1].position = this.players[playerIndex-1].position+total - max_container;
              if(prevPosition == 45){
                newPosition = 10+total;
              }
              else{
              newPosition = prevPosition+total - this.max_container;
              this.players[this.playerIndex-1].addSubMoney(false, 200, this.room);
              this.handlepopup('other','Salary 200 🤑🤑🤑','');
            }}
            else{
              newPosition = prevPosition + total;
            }
            message.functionsToCall.push('movePlayerAnimation');
            message.move = [this.playerIndex, this.players[this.playerIndex-1].position, newPosition];
            this.players[this.playerIndex - 1].position = newPosition;
            let splcard = this.getSpecialCardNameByPosition(newPosition);
            console.log(splcard,newPosition);
           if(splcard == 'Card not found'){
            console.log('check rent');
            const property = this.properties.find(prop => prop.position === newPosition);
            if (property.owner !== this.players[this.playerIndex-1].playerID)
                property.payRent(this.players[this.playerIndex-1], this, total);
            }else{
                console.log('rolled '+total);
                this.handleSpecialCard(splcard, random1,random2); 
            }
       }
       
        if (this.room) {
            this.room.broadcast({type: 'UpdateDiceRolled', message}); // Broadcast message to all players in the room
            this.gameState={type: 'UpdateDiceRolled', message};
        } else {
            console.error(`Room not found.`);
        }
    }

    handlejailwait(rolled) {
        //console.log('handle '+this.playerIndex);
        let currentPlayer = this.players[this.playerIndex-1];
        if(!currentPlayer.jail[0] || currentPlayer.jail[1] == 0 ){
            const first = Math.floor(Math.random() * (rolled - 1)) + 1;
            const second = rolled - first;
           this.movePlayer(first,second);
           //console.log('checked not in jail'); 
        }
        else{
            if(rolled == 6 ||rolled == 12){
                currentPlayer.jail[0] = false;
                currentPlayer.jail[1] = 0;
                this.handlepopup('other','Lucky','');
                const first = Math.floor(Math.random() * (rolled - 1)) + 1;
                const second = rolled - first;
                this.movePlayer(first,second);
            }
            else{
                this.handlepopup('unlucky','UNLUCKY !!!','Try Again');
            }
        }
    }

    payjail() {
        let currentPlayer = this.players[this.playerIndex-1];
        if(currentPlayer.money > 200){
        currentPlayer.jail[0] = false;
        currentPlayer.jail[1] = 0;
        currentPlayer.addSubMoney(true, 200, this.room);
        //this.clearpopup();
        return this.handlepopup('other','Repayed Jail','');
        }
        return this.handlepopup('jail','You are in Jail','');
    }

    waitjail() {
        let currentPlayer = this.players[this.playerIndex-1];
        console.log(currentPlayer.jail);
        if(currentPlayer.jail[1] >=3){
            currentPlayer.jail[0] = false;
            currentPlayer.jail[1] = 0;
            currentPlayer.addSubMoney(true, 200, this.room);
            //this.clearpopup();
            console.log("unlucky third time");
            this.handlepopup('other','Repayed Jail','Unlucky!!!');
        }
        else{currentPlayer.jail[1]++;
        currentPlayer.jail[0] = true;
        //this.clearpopup();
        console.log("wait "+currentPlayer.jail[1]);
    }
    }
    getSpecialCardNameByPosition(position) {
        for (let card of this.specialCards) {
            if (card.position === position) {
                return card.name.toLowerCase();
            }
        }
        return 'Card not found';
    }

    getPlayerById(playerId) {
        console.log(this.players.find(player => player.playerID === playerId));
        return this.players.find(player => player.playerID === playerId);
    }

    tradeProperty() {
       // this.handlepopup('trade','Trade with Players',"");
        let message ={
            functionsToCall : ['showTrade'],
            currentPlayer : [this.players[this.playerIndex-1].playerName,this.playerIndex-1],
            playersCards: this.players.map(player => player.cards),
            playersMoney: this.players.map(player => player.money),
            players: this.players.map(player => ({
                playerName: player.playerName,
                playerID: player.playerID
            }))
        };
        console.log(message);
        if (this.room) {
            this.room.sendToPlayer(this.players[this.playerIndex - 1].playerName,{type: 'TradeInitialization', message}); // Broadcast message to all players in the room
            this.gameState = {type: 'TradeInitialization', message};
        } else {
            console.error(`Room not found.`);
        }
    }
    handleTradeOffered (data){
        let message = {
            functionsToCall : ['handleTradeOffering'],
            data : data.data
        }
        this.room.sendToPlayer(data.data[0].offeredto[1],{type: 'TradeOffering', message});
    }

    deleteCardFromPlayer(playerId, card) {
        const playerCards = this.players[playerId].cards;
        //console.log(playerCards);
        for (let i = 0; i < playerCards.length; i++) {
            if (playerCards[i] == card) {
                playerCards.splice(i, 1); // Remove the card from the player's cards array
                let property = this.properties.find(property => property.card === card && property.owner === playerId);
                if (property) {
                    property.owner = null;
                }
                break; // Exit the loop once the card is found and removed
            }
        }
    }

    getCardByName(cardName) {
        for (const property of this.properties) {
            if (String(property.name) === String(cardName)) {
                //console.log("Card found:", property);
                return property;
            }
        }
        //console.log("Card not found.");
        return null; // Return null if card name is not found
    }

    submittingTrade(data) {
        let validOfferedCards = data.data[0];
        let validRequestedCards = data.data[1];
        let offeredto = data.offeredto;
        //console.log(this.players[this.playerIndex-1].cards);
        console.log(offeredto+" "+validOfferedCards+" "+validRequestedCards);
        if (validOfferedCards.length > 0) {
            //console.log('offered' + validOfferedCards);
            this.deleteCardFromPlayer(this.playerIndex - 1, validOfferedCards);
            validOfferedCards.forEach(cardName => {
                let card = this.getCardByName(cardName);
                if (card) {
                    //console.log(card);
                    card.owner = offeredto+1;
                    this.players[offeredto].cards.push(card.name);
                    console.log('offered to '+offeredto+" "+this.players[offeredto].playerName);

                }
            });
        }
        if (validRequestedCards.length > 0) {
            //console.log('requested' + validRequestedCards);
            validRequestedCards.forEach(cardName => {
                let card = this.getCardByName(cardName);
                if (card) {
                    card.owner = this.playerIndex; // Update the owner to the current player
                    this.players[this.playerIndex - 1].cards.push(card.name);
                }
            });
            this.deleteCardFromPlayer(parseInt(offeredto), validRequestedCards);
        }

        // Update player's money by subtracting the requested money and adding the offered money
        if (data.data[2]) {
            console.log('offered money '+data.data[2])
            this.players[offeredto].addSubMoney(false, data.data[2], this.room);
            this.players[this.playerIndex - 1].addSubMoney(true, data.data[2], this.room);
        }
        if (data.data[3]) {
            this.players[offeredto].addSubMoney(true, data.data[3], this.room);
            this.players[this.playerIndex - 1].addSubMoney(false, data.data[3], this.room);
        }
        console.log(this.players.map(player => ({
           cards: player.cards,
           playerName:player.playerName
        })));
        let allCards = [...validOfferedCards, ...validRequestedCards];
        let cardDataArray = [];
        
        // Iterate through all the cards
        allCards.forEach(cardName => {
        let card = this.getCardByName(cardName);
        if (card) {
            // Gather property details and color
            let property = {
                name: card.name,
                position: card.position
            };
            let color = this.color[card.owner-1]; // Owner's color
            console.log("owner "+card.owner);
            // Combine property and color into a single object and add to cardDataArray
            cardDataArray.push({
                property: [property.name, property.position],
                color: color
            });
        }
    });
        let message = {
            functionsToCall:['changeBuyIcon'],
            data:cardDataArray
        }
        this.room.broadcast({'type':'Trade Success',message});
    }
    changeposition(newpos, total) {
        const currentPlayer = this.players[this.playerIndex - 1];
        const prevpos = currentPlayer.position;
    
        if (newpos < prevpos) {
            currentPlayer.addSubMoney(false, 200, this.room); // Adding $200 for crossing GO
        }
        
        currentPlayer.position = newpos;
        console.log('moving to ',newpos);
        const splcard = this.getSpecialCardNameByPosition(newpos);
    
        if (splcard === 'Card not found') {
            //console.log('check rent');
            const property = this.properties.find(prop => prop.position === newpos);
            if (property.owner !== this.players[this.playerIndex-1].playerID)
                property.payRent(this.players[this.playerIndex-1], this, total);
        } else {
            this.handleSpecialCard(splcard, total);
        }
        let player = this.players[this.playerIndex-1];
        let playersData = {
            playerName: player.playerName,
            icon: player.icon,
            money: player.money,
            position: player.position,
            color: player.color
        };
        let message = {functionsToCall : ['handleChangePosition'],
            currentPlayerIndex : this.playerIndex,
            playersData:playersData,
            changePositionData: newpos
        }
        setTimeout(() => {
            this.room.broadcast({type: 'Changing Position', message});
        }, 200);   
    }
    buyProperty() {
        const currentPlayer = this.players[this.playerIndex - 1];
        const currentPosition = currentPlayer.position;
        const property = this.properties.find(p => p.position === currentPosition);
        console.log(property);

        if (property && property.buy(currentPlayer, this.room)) {
            //console.log('bought');
            this.handlepopup('buycard','Card Bought ',[{'property':[property.name,property.position]},this.color[property.owner-1]]);
            // let message = {functionsToCall : ['handlepopup','addBuyIcon'],
            //     handlepopupData:['buycard',`Card Bought ${property.name}`,''],
            //     property:property,
            //     currentPlayer : this.players[this.playerIndex-1].playerName,
            //     playersData:playersData
            // }
            // this.room.broadcast({type: 'BuyProperty', message});
            //console.log(currentPlayer.cards);
        } else {
            //console.log('cant buy');
        }
    }

    handlepopup(type,head,msg) {
        let message = {functionsToCall : ['handlepopup'],
            handlepopupData:[type,head,msg]
        }
        this.room.broadcast({type: 'Popup', message});
    }
    ClickedDone() {
        this.playerIndex++;
        if(this.playerIndex>this.players.length)
            this.playerIndex =1;
        if(this.players[this.playerIndex-1].bankrupt==true) //bankruptcy
            this.playerIndex++;
        this.isRolling = false;
        let message ={displayMessage : [1,this.messagePlayer[1]],
            functionsToCall : ['displayMessage'],
            currentPlayerIndex : this.playerIndex,
            playerName : this.players[this.playerIndex-1].playerName
        };
        this.checkGameOver();
        this.room.broadcast({type: 'NextPlayerMessage', message});
        this.checkNextPlayerJail();
        this.checkplayermoneyless();
    }
    checkGameOver() {
        let playersbankrupt =this.players.filter(player => player.bankrupt).length;
        console.log(playersbankrupt,this.players.length);
        if(this.players.length-1 == playersbankrupt){
            this.handlepopup('gamewon',`Player ${this.players.filter(player => !player.bankrupt).map(player => player.playerID)} Won`,'');
        }
    }
    handleBankruptcy(data) {
        let currentPlayer = this.players[this.playerIndex-1];
        currentPlayer.bankrupt = true;
        this.properties.forEach(property => {
            if (property.owner === currentPlayer.playerID) {
                property.owner = null;
            }});
        this.handlepopup('other',`Player ${currentPlayer.playerID} Declared Bankruptcy`,'');
        currentPlayer = null;
    }

    checkplayermoneyless() {
        let currentPlayer = this.players[this.playerIndex-1];
        if(currentPlayer.money<0){
            let message = {
                functionsToCall: ['handlepopup'],
                handlepopupData: ['lessmoney', 'Repay to Continue', '']
            };

            // Send message to the player
            this.room.sendToPlayer(
                this.players[this.playerIndex - 1].playerName,
                { type: 'Popup', message }
            );
        }
    }


    checkNextPlayerJail() {
        //console.log('player index'+this.playerIndex);
        let nextplayer = this.players[this.playerIndex-1];
        if(nextplayer.jail[0]){
            let message = {
                functionsToCall: ['handlepopup'],
                handlepopupData: ['jail', 'You Are In Jail', '']
            };

            // Send message to the player
            this.room.sendToPlayer(
                this.players[this.playerIndex - 1].playerName,
                { type: 'Popup', message }
            );
        }
        //console.log('next player jail '+nextPlayer.jail);
    }

    handleReload() {
        let playersData = this.players.map(player => ({
            playerName: player.playerName,
            icon: player.icon,
            money: player.money,
            position: player.position,
            color: player.color
        }));
        let message = {
            type: 'initilizingBack',
            playersData: playersData,
            gameState: this.gameState
        }
        return message;
    }
    splbirthday() {
        const currentPlayer = this.players[this.playerIndex - 1];
        const amountPerPlayer = 20;
        const totalAmount = this.players.length * amountPerPlayer;
    
        currentPlayer.addSubMoney(false, totalAmount, this.room);
    
        this.players.forEach(player => {
            if (player !== currentPlayer) {
                player.addSubMoney(true, amountPerPlayer, this.room);
            }
        });
    }
    handleSpecialCard(name, number1,number2) {
        //console.log(name);
        let rolled = number1+number2;
        let currentPlayer = this.players[this.playerIndex-1];
        const specialActions = {
            'chance': {
                2: () => [this.changeposition(45, rolled), /*this.handlepopup('chance', "Sent to Jail", "Crime")*/],
                3: () => [this.movePlayer(1,2), this.handlepopup('chance', 'Moving 3 Forward', "")],
                4: () => [currentPlayer.addSubMoney(true, 100, this.room), this.handlepopup('chance', 'School fee Paid $100', "")],
                5: () => [this.changeposition(45), /*this.handlepopup('chance', 'Sent to Jail', 'Kidnap')*/],
                6: () => [currentPlayer.addSubMoney(false, 100, this.room), this.handlepopup('chance', 'You got Refund $100', "Bank Error")],
                7: () => [this.changeposition(20), this.handlepopup('chance', 'Chance to Visit New York', '')],
                8: () => [currentPlayer.addSubMoney(true, 200, this.room), this.handlepopup('chance', 'Electric City Bill Paid $200')],
                9: () => this.handlepopup('chance', "Bank Error", 'Refund not Processed'),
                10: () => [currentPlayer.addSubMoney(false, 100, this.room), this.handlepopup('chance', 'Your property value increased', 'You are safe')],
                11: () => [currentPlayer.addSubMoney(false, 200, this.room), this.handlepopup('chance', 'You received Gift', '$200')],
                12: () => [currentPlayer.addSubMoney(false, 100, this.room), this.handlepopup('chance', 'Bank Paid Interest $50', '')]
            },
            'community chest': {
                2: () => [this.changeposition(28, rolled), this.handlepopup('chest', 'You are Visiting Ventor avenue', '')],
                3: () => [currentPlayer.addSubMoney(true, 150, this.room), this.handlepopup('chest', 'Your Computer Damaged', 'Repair charges $150')],
                4: () => [this.changeposition(45), /*this.handlepopup('chest', 'Sent to Jail', 'Selling Illegal Items')*/],
                5: () => [this.movePlayer(3,3), this.handlepopup('chest', 'Moving six Steps Ahead', '')],
                6: () => [this.splbirthday(),this.handlepopup('chest','Its Your Birthday','Collect 20 From Each Player')],
                7: () => [currentPlayer.addSubMoney(true, 100, this.room), this.handlepopup('chest', 'i Dont know', '')],
                // 8: () => this.handlepopup('chest', 'Nothing Special', ''),
                8: () => [currentPlayer.addSubMoney(false, 50, this.room), this.handlepopup('chest', 'Doctor Visiting fee $50', '')],
                9: () => [this.changeposition(1), this.handlepopup('chest', 'Advance to GO', '')],
                10: () => [currentPlayer.addSubMoney(false, 100, this.room), this.handlepopup('chest', 'Income Tax House raid', 'per Each house pay 25 and Each Hotel pay 50')],
                11: () => [currentPlayer.addSubMoney(false, 100, this.room), this.handlepopup('chest', 'Income Tax House raid', 'per Each house pay 25 and Each Hotel pay 50')],
                12: () => [this.movePlayer(3,1), this.handlepopup('chest', 'Moving Four Steps', '')]
            },
            'jail': [
        () => {
            // Use a block for the function body and declare 'let' properly
            let message = {
                functionsToCall: ['handlepopup'],
                handlepopupData: ['jail', 'sent to jail', '']
            };

            // Send message to the player
            this.room.sendToPlayer(
                this.players[this.playerIndex - 1].playerName,
                { type: 'Popup', message }
            );
        }],
            'income tax': [
                () => currentPlayer.addSubMoney(true, 200, this.room),
                () => this.handlepopup('income tax', 'Paid Income Tax $200', '')
            ],
            'free parking': [
                () => this.handlepopup('other', 'Visiting Free Parking', '')
            ],
            'electric company': [
                () => this.handlepopup('electric company', 'Landed on Electric Company', '')
            ],
            'water works': [
                () => this.handlepopup('water works', 'Landed on Water Works', '')
            ],
            'Go': [
                () => this.handlepopup('other', 'Landed on Start', 'Collect $200')
            ],
            'go to jail': [
                // () => this.handlepopup('go to jail', 'Go to Jail', 'Do not pass GO, do not collect $200'),
                () => this.changeposition(45) // Position of Jail
            ],
            'luxury tax': [
                () => currentPlayer.addSubMoney(true, 75, this.room),
                () => this.handlepopup('luxury tax', 'Paid Luxury Tax $75', '')
            ],
            'just visiting': [
                () => this.handlepopup('other','Just Visiting Jail','')
            ]
        };
    
        if (specialActions[name]) {
            if (Array.isArray(specialActions[name])) {
                specialActions[name].forEach(action => action());
            } else if (specialActions[name][rolled]) {
                specialActions[name][rolled]();
            }
        } else {
            console.log('Unhandled special card name:', name);
        }
    }
    
}

module.exports = Game;
