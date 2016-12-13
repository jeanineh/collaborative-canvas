
window.onload = function() {
  var socket = io.connect();

  // +++++++++++++++++++++++++++++++++++++++++++
  //                 CANVAS JS
  // +++++++++++++++++++++++++++++++++++++++++++
  document.onmousedown = function(e){ e.preventDefault(); }
  var canvas  = document.getElementById('board');
  var rect = canvas.getBoundingClientRect();
  var canvastop = rect.top;
  var canvasleft = rect.left; 

  // HTML5 has a context 2d that allows for drawing lines, dots, etc.
  var context = canvas.getContext("2d");

  var lastx;
  var lasty;

  var isDrawing = false;

  context.strokeStyle = "#000000";
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 5;

  function clear() {
    context.fillStyle = "#ffffff";
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();
  }

  function dot(x,y) {
    context.beginPath();
    context.fillStyle = "#000000";
    context.arc(x,y,1,0,Math.PI*2,true);
    context.fill();
    context.stroke();
    context.closePath();
  }

  function line(fromx,fromy, tox,toy) {
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();
    context.closePath();
  }

  // start drawing 
  var doOnMouseDown = function(event){                 
    event.preventDefault();  
    
    if($(this).attr('id') == 'board') {
      isDrawing = true;

      lastx = event.clientX - canvasleft;
      lasty = event.clientY - canvastop;  
      
      // Tell connected clients that this player is drawing a dot
      socket.emit('drawDot', {'lastx':lastx, 'lasty':lasty});

      dot(lastx,lasty);
    }
  }

  // Update canvas
  socket.on('drawingDot', function(data) {
    dot(data.lastx, data.lasty);
  });

  canvas.addEventListener("mousedown", doOnMouseDown);

  // drawing
  var doOnMouseMove = function(event){                   
    event.preventDefault();      

    if(isDrawing) {
      var newx = event.clientX - canvasleft;
      var newy = event.clientY - canvastop;

      line(lastx,lasty, newx,newy);

      // Tell connected clients that this player is drawing
      socket.emit('drawLine', {'lastx':lastx, 'lasty':lasty, 'newx': newx, 'newy':newy });

      lastx = newx;
      lasty = newy;
    }
  }

  canvas.addEventListener("mousemove", doOnMouseMove);

  // Update canvas
  socket.on('drawingLine', function(data) {
    line(data.lastx, data.lasty, data.newx, data.newy);
  });

  // stop drawing
  var doOnMouseUp = function(event) {
    event.preventDefault();
    isDrawing = false;
  }

  canvas.addEventListener("mouseup", doOnMouseUp);

  // Clear canvas
  $('#clear').click(function() {
    socket.emit('cleared canvas');
    clear();
  });

  socket.on('clear canvas', function() {
    clear();
  });



  // +++++++++++++++++++++++++++++++++++++++++++
  //                 CHATBOX JS
  // +++++++++++++++++++++++++++++++++++++++++++


  // Get the player's username
  socket.on('connect', function() {
    socket.emit('newplayer', prompt("What's your name?"));
  });

  // Received a message, update chatbox
  socket.on('updatechat', function(username, data) {
    // Check if the round has started and whether we should vaidate guesses
    if (gameState == 1 && currentCard != null) {
      if (data.toLowerCase() == currentCard.word.toLowerCase()) {
        socket.emit('give points', username, currentCard.points);
        // Round is over
        gameState = 0;
      }
    }
    // Update chatbox
    $('#chatbox').append('<p><b>' + username + ':</b> ' + data + '</p>');
  });

  // Update the list of users and their scores
  socket.on('updateplayers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
      $('#users').append('<li class="collection-item"><div>' + '<span class="teal-text">' + key + '</span>' + '<span class="secondary-content teal-text">' + data[key].score + '</span></li>');
    });
  });

  // Send a message to the chat
  $('#sendmsg').click(function() {
    var message = $('#msg').val();
    $('#msg').val('');
    socket.emit('sendmessage', message);
  });

  // Pressing enter also sends a message
  $('#msg').keypress(function(e) {
    if(e.which == 13) {
      $('#sendmsg').focus().click();
    }
  });

  // Update how many players are currently connected
  socket.on('players', function(data) {
    console.log(data);
    $("#numPlayers").text(data.number + ' players');
  });

  // +++++++++++++++++++++++++++++++++++++++++++
  //           GAME LOGIC / GAME JS
  // +++++++++++++++++++++++++++++++++++++++++++

  // For localStorage. This stores the number of turns/rounds the player has played
  var gameData = {totalRounds: 0};

  // Load the gameData from localStorage
  loadDataFromLocalStorage();
  
  // 0 for not yet started, 1 for started
  var gameState = 0; 

  // The current card that's being drawn
  var currentCard = null;

  // Contains the list of cards to be used in gameplay
  var deck = [
    {"word": "horse", "points": 5, "level": "medium"},
    {"word": "photograph", "points": 5, "level": "medium"},
    {"word": "circus", "points": 5, "level": "medium"},
    {"word": "pinwheel", "points": 5, "level": "medium"},
    {"word": "cake", "points": 5, "level": "medium"},
    {"word": "lawnmower", "points": 5, "level": "medium"},
    {"word": "bomb", "points": 5, "level": "medium"},
    {"word": "song", "points": 5, "level": "medium"},
    {"word": "vegetarian", "points": 10, "level": "hard"},
    {"word": "neighborhood", "points": 10, "level": "hard"},
    {"word": "exercise", "points": 10, "level": "hard"},
    {"word": "yolk", "points": 10, "level": "hard"},
    {"word": "macaroni", "points": 10, "level": "hard"},
    {"word": "vegetarian", "points": 10, "level": "hard"},
    {"word": "biscuit", "points": 5, "level": "jard"},
    {"word": "smile", "points": 1, "level": "easy"},
    {"word": "shoe", "points": 1, "level": "easy"},
    {"word": "bird", "points": 1, "level": "easy"},
    {"word": "ocean", "points": 1, "level": "easy"},
    {"word": "whale", "points": 1, "level": "easy"},
    {"word": "tree", "points": 1, "level": "easy"},
  ];

  // Selects a random card from the deck
  function drawFromDeck() {
    let index = Math.floor(Math.random() * deck.length);
    return deck[index];
  }

  /* Draws a random card and displays it to the player,
   * then disabled so they can't draw another card
   */
  $('#new-word').click(function() {
    currentCard = drawFromDeck();
    socket.emit('take turn', 'hi');
    $('#gameword').html("<p>" + currentCard.word + "</p>");
    $(this).toggleClass('disabled');
  });

  // Starts the game, hides the start button, shows the 'End game' button
  $('#start').click(function() {
    $(this).addClass('hide');
    $('#stop').removeClass('hide');
    socket.emit('game start');
  });

  // Disables the start button
  socket.on('disable start', function() {
    $('#start').addClass('disabled');
  });

  // When it's the player's turn, let them see their word/draw a card
  socket.on('turn', function() {
    socket.emit('cleared canvas');
    gameData.totalRounds+=1;
    $('#new-word').css({opacity: 1});
    $('#new-word').removeClass('disabled');
  });

  // Updates game state
  socket.on('update game', function(data) {
    gameState = data;
  });

  // Ends the game, saves gameData to local storage
  $('#stop').click(function() {
    socket.emit('game end');
    saveDataToLocalStorage();
    $(this).addClass('hide');
    $('#start').removeClass('hide');
  });

  // For displaying locally stored data
  $('#stats').click(function() {
    console.log(gameData);
    $('#game-stats').html(gameData.totalRounds);
  });

  function saveDataToLocalStorage() {
    // Turn scores into a JSON string, and store it to localStorage
    localStorage.gameData = JSON.stringify(gameData);
  }

  function loadDataFromLocalStorage() {
    // If scores have been stored to localStorage
    if (localStorage.gameData && JSON.parse(localStorage.gameData)) {
      // retrieve and parse the JSON
      gameData = JSON.parse(localStorage.gameData);
    }
  }
}




  