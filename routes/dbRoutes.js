var mongoModel = require("../models/mongoModel.js");
const collection = 'leaderboard';
// define the routes for this controller
exports.init = function(app) {
  app.get('/gameInfo', doRetrieve);
  app.get('/help', help);
  app.put('/leaderboard', doCreate); // CRUD Create
  app.post('/leaderboard', doUpdate); // CRUD Update
  app.delete('/leaderboard', doDelete); // CRUD Delete
}

help = function(req, res) {
  res.render('help', {title: 'MongoDB Test'});
}

doCreate = function(req, res) {
  if(Object.keys(req.body).length == 0) {
    res.render('message', {title: 'Mongo Demo', obj: "No create message body found"});
    return;
  }
  mongoModel.create(collection, req.body, function(result) {
    var success = (result ? "Create successfull" : "Create unsuccessful");
    res.render('message', {title: 'Mongo Demo', obj: success});
  });
}

doRetrieve = function(req, res) {
  mongoModel.retrieve(collection, req.query, function(modelData) {
    if (modelData.length) {
      res.render('results', {title: '', obj: modelData});
    }
    else {
      var message = "No documents with " + JSON.stringify(req.query) + " in collection " + collection + " found.";
      res.render('message', {title: 'Mongo Demo', obj: message});
    }
  });
}

doUpdate = function(req, res) {
  var filter = req.body.find ? JSON.parse(req.body.find) : {};
  if(!req.body.update) {
    res.render('message', {title: 'Mongo Demo', obj: "No update operation defined"});
    return;
  }
  var update = JSON.parse(req.body.update);
  mongoModel.update(collection, filter, update, function(status) {
    res.render('message', {title: 'Mongo Demo', obj: status});
  });
}

doDelete = function(req, res) {
  var filter = req.body.find ? JSON.parse(req.body.find) : {};
  mongoModel.delete(collection, filter, function(status) {
   res.render('message', {title: 'Mongo Demo', obj: status});
  });
}