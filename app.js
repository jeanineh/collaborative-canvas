var morgan = require('morgan');
var fs = require('fs');
var path = require('path');

var express = require('express');
var app = express();

// Set the views directory
app.set('views', __dirname + '/views');

// Define the view (templating) engine
app.set('view engine', 'ejs');

// Define how to log events
app.use(morgan('tiny'));

// Load all routes in the directory 
try {
  fs.readdirSync('./routes').forEach(function (file){
    // There might be non-js files in the directory that should not be loaded
    if (path.extname(file) == '.js') {
      require('./routes/'+ file).init(app);
    }
  });
}
catch (exception) {
  if (exception.code == "ENOENT") {

  } else {
    console.error(exception);
    process.exit(1);
  }
}

// Handle static files
app.use(express.static(__dirname + '/public', { index: 'index.html'}));

// Catch any routes not already handled with an error message
app.use(function(req, res) {
  var message = 'Error, did not understand path '+req.path;
  // set the status to 404 not found, and render a message to the user.
  res.status(404).render('error', { 'message': message });
});

// Boilerplate for setting up socket.io alongside Express
var httpServer = require('http').createServer(app);
var sio = require('socket.io')(httpServer);

// The server socket.io code is in the socketio directory
require('./socketio/serverSocket.js').init(sio);

httpServer.listen(50000, function() { console.log('listening on 50000'); });
