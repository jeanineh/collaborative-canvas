exports.init = function(io) {
  var currentPlayers = 0; // keep track of the players
  var players = {}; // contains player data
  var connectedPlayers = [];  // keep track of the order of players, used for selecting players 
  // which player's turn is it?
  var playerTurn = 0;
  var gameState = 0;

  
  // When a new connection is initiated
  io.sockets.on('connection', function(socket) {
    ++currentPlayers;
    // Send ("emit") a 'players' event back to the socket that just connected.
    socket.emit('players', { number: currentPlayers });
    socket.emit('welcome', { number: currentPlayers});
    /* 
     * Emit players events also to all (i.e. broadcast) other connected sockets.
     * Broadcast is not emitted back to the current (i.e. "this") connection
    */
    socket.broadcast.emit('players', { number: currentPlayers });

    socket.on('drawLine', function(data) {
      socket.broadcast.emit('drawingLine', data);
    });

    socket.on('drawDot', function(data) {
      socket.broadcast.emit('drawingDot', data);
    });

    socket.on('sendmessage', function(data) {
      io.sockets.emit('updatechat', socket.player, data);
    });

    socket.on('newplayer', function(player) {
      socket.player = player;
      players[player] = {id: socket.id, username: player, score: 0};
      connectedPlayers.push(player);
      socket.emit('updatechat', 'SERVER', 'You have connected');
      socket.broadcast.emit('updatechat', 'SERVER', player + ' has entered.');
      io.sockets.emit('updateplayers', players);
    });

    socket.on('game start', function(player) {
      let firstPlayer = connectedPlayers[playerTurn]; // name of the first player
      io.sockets.emit('updatechat', 'SERVER', 'The game has started!');
      io.sockets.connected[players[firstPlayer].id].emit('turn', 'Player 1'); 
      io.sockets.connected[players[firstPlayer].id].emit('updatechat', 'SERVER', 'Hey, it\'s your turn! Pick a word and start drawing.');
      io.sockets.connected[players[firstPlayer].id].broadcast.emit('updatechat', 'SERVER', 'It\'s ' + firstPlayer + '\'s turn. Start guessing!');
      
    });

    socket.on('take turn', function() {
      gameState = 1;
      io.sockets.emit('update game', gameState);
    });

    socket.on('give points', function(player, points) {
      gameState = 0;
      io.sockets.emit('update game', gameState);
      players[player].score += points;
      socket.emit('updateplayers', players);
      ++playerTurn;
      let nextPlayer = connectedPlayers[playerTurn];
      io.sockets.connected[players[nextPlayer].id].emit('turn', 'Player 1'); 
      io.sockets.connected[players[nextPlayer].id].emit('updatechat', 'SERVER', 'Hey, it\'s your turn! Pick a word and start drawing.');
      io.sockets.connected[players[nextPlayer].id].broadcast.emit('updatechat', 'SERVER', 'It\'s ' + nextPlayer + '\'s turn. Start guessing!');
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