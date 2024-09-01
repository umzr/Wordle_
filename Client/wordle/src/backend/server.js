const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const answers = require('./word'); // Ensure this file exports an array of possible answers

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const socketPORT = process.env.PORT ? parseInt(process.env.PORT) + 1000 : 4500;

// Helper function to generate a random string
const generateRandomString = (length = 5) => {
  return Math.random().toString(36).substring(2, 2 + length);
};

app.get('/game/:userid', (req, res) => {
  const { userid } = req.params;
  // Return user-specific data or status
  res.json({ message: 'User found', userid });
});

class Server {
  constructor() {
    this.io = io;
    this.rooms = {}; // Store rooms with players
    this.waitingPlayers = []; // List of players waiting to be matched

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Generate a random player name and room name
      const playerName = generateRandomString();
      const roomName = generateRandomString(6);

      // Join a room or create a new one
      socket.join(roomName);
      this.rooms[roomName] = this.rooms[roomName] || [];
      this.rooms[roomName].push({ socketId: socket.id, playerName });

      console.log(`Player ${playerName} joined room ${roomName}`);

      // Notify the frontend about the room and player details
      socket.emit('roomDetails', { roomName, playerName });

      // Listen for game-related events
      socket.on('waitRoom', (data) => this.handleWaitRoom(socket, data, roomName));
      socket.on('disconnect', () => this.handleDisconnect(socket, roomName));
    });

    server.listen(socketPORT, () => {
      console.log('(socket) listening on *:' + socketPORT);
    });
  }

  handleWaitRoom(socket, data, roomName) {
    console.log('(waitRoom):', socket.id);

    // Get the keyword or assign a random one if not provided
    const keyword = data.keyword || this.getRandomAnswer();

    const roomPlayers = this.rooms[roomName];

    if (roomPlayers.length === 2) {
      const player1 = roomPlayers[0];
      const player2 = roomPlayers[1];
      this.startGame(player1, player2, roomName);
    }
  }

  startGame(player1, player2, roomName) {
    console.log("Starting a new game between:", player1.playerName, "and", player2.playerName);

    const player1Keyword = this.getRandomAnswer();
    const player2Keyword = this.getRandomAnswer();

    this.io.to(player1.socketId).emit('gameRoom', {
      word: player1Keyword,
      opponent: {
        socketId: player2.socketId,
        playerName: player2.playerName,
      },
    });

    this.io.to(player2.socketId).emit('gameRoom', {
      word: player2Keyword,
      opponent: {
        socketId: player1.socketId,
        playerName: player1.playerName,
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
        this.io.to(opponentSocketId).emit('opponentState', { row: data.row, word: data.word });
      });
    }
  }

  handleDisconnect(socket, roomName) {
    console.log("A player disconnected:", socket.id);

    // Remove the player from the room
    this.rooms[roomName] = this.rooms[roomName].filter(p => p.socketId !== socket.id);

    // If room is empty, delete it
    if (this.rooms[roomName].length === 0) {
      delete this.rooms[roomName];
    }
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
