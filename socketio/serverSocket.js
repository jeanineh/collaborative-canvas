exports.init = function(io) {
  var currentPlayers = 0; // keep track of the players
  var players = {}; // contains player data
  var connectedPlayers = [];  // keep track of the order of players, used for selecting players 
  var playerTurn = 0; // which player's turn is it?
  var gameState = 0; // used to determine whether we should check if the player messages match the word. 0 for no, 1 for yes
  var currentCard = null;

  // for pushing player/game info to the mongoDB collection
  var mongoModel = require("../models/mongoModel.js");
  const collection = 'leaderboard';
  
  // When a new connection is initiated
  io.sockets.on('connection', function(socket) {
    ++currentPlayers;
    // Send ("emit") a 'players' event back to the socket that just connected.
    socket.emit('players', { number: currentPlayers });
    /* 
     * Emit players events also to all (i.e. broadcast) other connected sockets.
     * Broadcast is not emitted back to the current (i.e. "this") connection
    */
    socket.broadcast.emit('players', { number: currentPlayers });

    // Current player has started drawing, tell other connected players 
    socket.on('drawLine', function(data) {
      socket.broadcast.emit('drawingLine', data);
    });

    socket.on('drawDot', function(data) {
      socket.broadcast.emit('drawingDot', data);
    });

    socket.on('cleared canvas', function() {
      io.sockets.emit('clear canvas');
    });

    // Update chatbox when a message is send
    socket.on('sendmessage', function(data) {
      io.sockets.emit('updatechat', socket.player, data);
    });

    /* 1. Create a player (ex: {id: 1, username: "Bob", score: 0}) to be put in the players hash. 
     * 2. Add the new player's username to the connectedPlayers "queue", to be used for 
     *    determining the order of player turns.
     * 3. Notify other connected clients that a new player has joined and update their players.
    */ 
    socket.on('newplayer', function(player) {
      socket.player = player;
      players[player] = {id: socket.id, username: player, score: 0};
      connectedPlayers.push(player);
      socket.emit('updatechat', 'SERVER', 'You have joined. ');
      socket.broadcast.emit('updatechat', 'SERVER', player + ' has entered.');
      io.sockets.emit('updateplayers', players);
    });

    /* First player to join gets to play first. Notify the player that it's their turn, 
     * and the other players whose turn it is. 
    */
    socket.on('game start', function(player) {
      let firstPlayer = connectedPlayers[playerTurn]; // name of the first player
      socket.broadcast.emit('disable start'); // Don't let other clients click the start button after the game has started
      io.sockets.emit('updatechat', 'SERVER', 'The game has started!');
      io.sockets.connected[players[firstPlayer].id].emit('turn'); 
      io.sockets.connected[players[firstPlayer].id].emit('updatechat', 'SERVER', 'Hey, it\'s your turn! Pick a word and start drawing.');
      io.sockets.connected[players[firstPlayer].id].broadcast.emit('updatechat', 'SERVER', 'It\'s ' + firstPlayer + '\'s turn. Start guessing!');
    });

    // The current player has received their word and the other players can now start guessing.
    socket.on('take turn', function(data) {
      gameState = 1;
      io.sockets.emit('update game', gameState);
    });

    /* This player guessed correctly and has their score updated.
     * Other players won't receive points anymore for correct guesses
     * Rotate through the connectedPlayers array and tell the next player it's their turn.
    */
    socket.on('give points', function(player, points) {
      gameState = 0;
      io.sockets.emit('update game', gameState);
      players[player].score += points;
      io.sockets.emit('updateplayers', players);
      ++playerTurn;
      // Back to the first player
      if (playerTurn > connectedPlayers.length-1) {
        playerTurn = 0;
      }
      let nextPlayer = connectedPlayers[playerTurn];
      io.sockets.connected[players[nextPlayer].id].emit('updatechat', 'SERVER', 'Hey, it\'s your turn! Pick a word and start drawing.');
      io.sockets.connected[players[nextPlayer].id].broadcast.emit('updatechat', 'SERVER', 'It\'s ' + nextPlayer + '\'s turn. Start guessing!');
      io.sockets.connected[players[nextPlayer].id].emit('turn'); 
    });

    // After the game has ended, push the player data to the mongoDB collection
    socket.on('game end', function() {
      mongoModel.create(collection, players, function(result) {
        var success = (result ? "Create successfull" : "Create unsuccessful");
        console.log(success);
      });
    });

    /*
     * Upon this connection disconnecting (sending a disconnect event)
     * decrement the number of players and emit an event to all other
     * sockets. Notice it would be nonsensical to emit the event back to the
     * disconnected socket.
     */
    socket.on('disconnect', function() {
      --currentPlayers;
      delete players[socket.player];
      connectedPlayers.splice(connectedPlayers.indexOf(socket.player), 1);
      io.sockets.emit('updateplayers', players);
      socket.broadcast.emit('players', { number: currentPlayers });
      socket.broadcast.emit('updatechat', 'SERVER', socket.player + ' has left the room.');
    }); 

  });
}