# collaborative-canvas
Final project for 67-328 Building Distributed Applications. The current placeholder name for the application is 'DrawStuff', which may be changed in the future.

DrawStuff is a fun, collaborative game you can play with your friends! This is an implementation of Draw My Thing, using node.js, socket.io, and HTML5 canvas. Once players have joined a room and the game has started, each person takes turns drawing a random card from the deck of words. The other players must guess what they're drawing, and once a player has gotten it correct, that player and the drawer are rewarded points. A record of each game is stored in a mongoDB database. 

### Setup Instructions:
You must have node installed: http://nodejs.org. Install dependencies:
```
npm install
npm start
```


You're all set!

### Demo:
https://countplayers-jocuttskwb.now.sh/
