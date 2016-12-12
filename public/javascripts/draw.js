
window.onload = function() {
  var socket = io.connect();

  document.onmousedown = function(e){ e.preventDefault(); }
  var canvas  = document.getElementById('main');
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
    context.rect(0, 0, 300, 300);
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

  var doOnMouseDown = function(event){                 
    event.preventDefault();  
    
    if($(this).attr('id') == 'main') {
      isDrawing = true;

      lastx = event.clientX - canvasleft;  // try substituting 1
      lasty = event.clientY - canvastop;   // or 2 for index for multitouch
      
      socket.emit('drawDot', {'lastx':lastx, 'lasty':lasty});

      dot(lastx,lasty);
    }
  }

  socket.on('drawingDot', function(data) {
    dot(data.lastx, data.lasty);
  });

  canvas.addEventListener("mousedown", doOnMouseDown);

  var doOnMouseMove = function(event){                   
    event.preventDefault();      

    if(isDrawing) {
      var newx = event.clientX - canvasleft;
      var newy = event.clientY - canvastop;

      line(lastx,lasty, newx,newy);

      socket.emit('drawLine', {'lastx':lastx, 'lasty':lasty, 'newx': newx, 'newy':newy });

      lastx = newx;
      lasty = newy;
    }
  }

  canvas.addEventListener("mousemove", doOnMouseMove);

  socket.on('drawingLine', function(data) {
    line(data.lastx, data.lasty, data.newx, data.newy);
  });

  var doOnMouseUp = function(event) {
    event.preventDefault();
    isDrawing = false;
  }

  canvas.addEventListener("mouseup", doOnMouseUp);

  var clearButton = document.getElementById('clear');
  clearButton.onclick = clear;

  clear();

  // html js
  socket.on('connect', function() {
    socket.emit('newplayer', prompt("What's your name?"));
  });

  socket.on('updatechat', function(username, data) {
    if (gameState == 1 && currentCard != null) {
      if (data.toLowerCase() == currentCard.word.toLowerCase()) {
        socket.emit('give points', username, currentCard.points);
        gameState = 0;
      }
    }
    
    $('#chatbox').append('<b>' + username + ':</b> ' + data + '<br/>');
  });

  socket.on('updateplayers', function(data) {
    $('#users').empty();
    $.each(data, function(key, value) {
      $('#users').append('<div>' + key + ': ' + data[key].score + '</div>');
    });
  });

  $('#sendmsg').click(function() {
    var message = $('#msg').val();
    $('#msg').val('');
    socket.emit('sendmessage', message);
  });

  $('#msg').keypress(function(e) {
    if(e.which == 13) {
      $('#sendmsg').focus().click();
    }
  });

  socket.on('players', function(data) {
    console.log(data);
    $("#numPlayers").text(data.number);
  });

  /* =========== actual game logic ============= */
  
  // 0 for not yet started, 1 for started
  var gameState = 0; 

  // the current word that's being drawn
  var currentCard = null;

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

  function drawFromDeck() {
    let index = Math.floor(Math.random() * deck.length);
    return deck[index];
  }

  $('#new-word').click(function() {
    currentCard = drawFromDeck();
    socket.emit('take turn', 'hi');
    $('#gameword').append("<p>" + currentCard.word);
    $(this).css({opacity: 0});
  });

  $('#start').click(function() {
    socket.emit('game start');
    $(this).css({opacity: 0});
  });

  socket.on('turn', function(data) {
    $('#new-word').css({opacity: 1});
  });

  socket.on('update game', function(data) {
    gameState = data;
  });

  socket.on('card chosen', function(data) {
    currentCard = data;
  });

  $('#stop').click(function() {
    socket.emit('game end');
    $(this).css({opacity: 0})
    $('#start').css({opacity:1});
  });

}




  