const http = require('http');
const express = require('express'); // Add express for handling HTTP requests
const socketIo = require('socket.io');
const answers = require('./word'); // Ensure this file exports an array of possible answers

const app = express(); // Initialize Express
const server = http.createServer(app); // Use the same server for express and socket.io
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const socketPORT = process.env.PORT ? parseInt(process.env.PORT) + 1000 : 4500;

app.get('/game/:userid', (req, res) => {
  const { userid } = req.params;
  // Logic to handle this request, possibly checking user status or returning user-specific data
  res.json({ message: 'User found', userid });
});

class Server {
  constructor() {
    this.io = io;
    this.waitingPlayers = []; // List of players waiting to be matched

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Listen for waitRoom event to add the player to the waiting room
      socket.on('waitRoom', (data) => this.handleWaitRoom(socket, data));

      // Listen for disconnect event to remove the player
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });

    server.listen(socketPORT, () => {
      console.log('(socket) listening on *:' + socketPORT);
    });
  }

  handleWaitRoom(socket, data) {
    console.log('(waitRoom):', socket.id);

    if (!this.waitingPlayers.some((p) => p.socketId === socket.id)) {
      const keyword = data.keyword || this.getRandomAnswer();

      this.waitingPlayers.push({
        socketId: socket.id,
        userId: data.userid,
        keyword: keyword,
        rating: data.rating || 1500,
      });

      console.log("Now online:", this.waitingPlayers.map(p => p.socketId));

      if (this.waitingPlayers.length === 2) {
        const player1 = this.waitingPlayers.shift();
        const player2 = this.waitingPlayers.shift();
        this.startGame(player1, player2);
      }

      socket.on('cleanServer', () => this.cleanServer(socket));
    } else {
      console.log('(waitRoom): user already exists:', socket.id);
    }
  }

  startGame(player1, player2) {
    console.log("Starting a new game between:", player1.socketId, "and", player2.socketId);

    const player1Keyword = player1.keyword || this.getRandomAnswer();
    const player2Keyword = player2.keyword || this.getRandomAnswer();

    console.log('Player 1 keyword:', player1Keyword);
    console.log('Player 2 keyword:', player2Keyword);

    this.io.to(player1.socketId).emit('gameRoom', {
      word: player1Keyword,
      opponent: {
        socketId: player2.socketId,
        rating: player2.rating,
      },
    });

    this.io.to(player2.socketId).emit('gameRoom', {
      word: player2Keyword,
      opponent: {
        socketId: player1.socketId,
        rating: player1.rating,
      },
    });

    this.setupGameListeners(player1.socketId, player2.socketId);
    this.setupGameListeners(player2.socketId, player1.socketId);
  }

  setupGameListeners(playerSocketId, opponentSocketId) {
    const playerSocket = this.io.sockets.sockets.get(playerSocketId);
    if (playerSocket) {
      playerSocket.on('submitWord', (data) => {
        console.log('(submitWord)', data);
        this.io.to(opponentSocketId).emit('opponentState', { row: data.row, word: data.word, board: data.board });
      });
    }
  }

  handleDisconnect(socket) {
    console.log("A player disconnected:", socket.id);

    this.waitingPlayers = this.waitingPlayers.filter((p) => p.socketId !== socket.id);
  }

  cleanServer(socket) {
    socket.removeAllListeners("submitWord");
    socket.removeAllListeners("cleanServer");
    this.waitingPlayers = this.waitingPlayers.filter((p) => p.socketId !== socket.id);
    console.log("Cleaned server for:", socket.id);
  }

  getRandomAnswer() {
    if (answers.length > 0) {
      return answers[Math.floor(Math.random() * answers.length)];
    } else {
      console.error("No answers available in 'answers' array.");
      return "default";
    }
  }
}

const main = () => {
  new Server();
};

main();
