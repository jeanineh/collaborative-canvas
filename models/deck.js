// a variable containing all the cards used in the game
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

// draw a random card from deck
exports.drawFromDeck = function() {
  let index = Math.floor(Math.random() * deck.length);
  return deck[index];
}

exports.allCards = function() {
  return deck;
}