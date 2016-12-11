/* A test file for the deck model */

var deck = require("./deck.js");
cards = deck.allCards();
console.log(cards.length);
card1 = deck.drawFromDeck();
console.log(card1);
console.log(card1.word);