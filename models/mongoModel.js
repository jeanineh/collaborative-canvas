/*
 * Use the Node.js MongoDB Driver
 */

var mongoClient = require('mongodb').MongoClient;

// for running mongodb locally
var connection_string = 'mongodb://localhost:27017/leaderboard';

// if the mlab env variable exists, use it in an mLab connection string instead of a locally hosted mongoDB one
// deply with now -e MLAB_LEADERBOARD_PASSWD=@leaderboard_passwd
if(process.env.MLAB_LEADERBOARD_PASSWD) {
  connection_string = "mongodb://jhadmin:" + process.env.MLAB_LEADERBOARD_PASSWD + "@ds159497.mlab.com:59497/leaderboard";
}

// global variable of the connected database
var mongoDB;

// connect to the mongoDB server
mongoClient.connect(connection_string, function(err, db) {
  if (err) doError(err);
  mongoDB = db; // make reference to db globally available
});

/************************ CRUD Create -> Mongo insert *************************/
exports.create = function(collection, data, callback) {
  // do an asynchronous insert into the given collection
  mongoDB.collection(collection).insertOne(data, function(err, status) {
    if (err) doError(err);
    var success = (status.result.n == 1 ? true : false);
    callback(success);
  });
}

/************************ CRUD Retrieve -> Mongo find *************************/
exports.retrieve = function(collection, query, callback) {
  mongoDB.collection(collection).find(query).toArray(function(err, docs) {
    if (err) doError(err);
    callback(docs);
  });
}

/************************ CRUD Update -> Mongo updateMany *************************/
exports.update = function(collection, filter, update, callback) {
  mongoDB.collection(collection).updateMany(filter, update, {upsert: true}, function(err, status) {
    if (err) doError(err);
    callback('Modified ' + status.modifiedCount + ' and added ' + status.upsertedCount+ ' documents');
  });
}

/************************ CRUD Delete -> Mongo deleteMany *************************/
exports.delete = function(collection, filter, callback) {
  mongoDB.collection(collection).deleteMany(filter, function(err, status) {
    if (err) doError(err);
    callback('Removed ' + status.deletedCount + ' documents');
  });
}

var doError = function(e) {
  console.error("ERROR: " + e);
  throw new Error(e);
}