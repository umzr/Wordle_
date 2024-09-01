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

      // Generate a random player name
      const playerName = generateRandomString();

      // Add player to the waiting pool
      this.waitingPlayers.push({ socketId: socket.id, playerName });

      console.log(`Player ${playerName} added to the waiting pool.`);

      // Attempt to match players if there are enough in the pool
      if (this.waitingPlayers.length >= 2) {
        this.matchPlayers();
      }

      // Listen for game-related events
      socket.on('waitRoom', (data) => this.handleWaitRoom(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });

    server.listen(socketPORT, () => {
      console.log('(socket) listening on *:' + socketPORT);
    });
  }

  matchPlayers() {
    if (this.waitingPlayers.length >= 2) {
      // Take two players from the waiting pool
      const player1 = this.waitingPlayers.shift();
      const player2 = this.waitingPlayers.shift();

      // Create a new room name
      const roomName = generateRandomString(6);

      // Add the room to the rooms list
      this.rooms[roomName] = [player1, player2];

      // Join the players to the new room
      player1.roomName = roomName;
      player2.roomName = roomName;
      this.io.to(player1.socketId).to(player2.socketId).socketsJoin(roomName);

      console.log(`Matched players ${player1.playerName} and ${player2.playerName} into room ${roomName}`);

      // Notify the frontend about the room and player details
      this.io.to(player1.socketId).emit('roomDetails', { roomName, playerName: player1.playerName });
      this.io.to(player2.socketId).emit('roomDetails', { roomName, playerName: player2.playerName });

      // Start the game
      this.startGame(player1, player2, roomName);
    }
  }

  handleWaitRoom(socket, data) {
    console.log('(waitRoom):', socket.id);

    // Get the player from the socket ID
    const player = this.getPlayerBySocketId(socket.id);
    if (!player || !player.roomName) return;

    const roomName = player.roomName;

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

  handleDisconnect(socket) {
    console.log("A player disconnected:", socket.id);

    // Find and remove the player from the waiting pool
    this.waitingPlayers = this.waitingPlayers.filter(player => player.socketId !== socket.id);

    // Find and remove the player from any room
    for (const [roomName, players] of Object.entries(this.rooms)) {
      this.rooms[roomName] = players.filter(p => p.socketId !== socket.id);
      if (this.rooms[roomName].length === 0) {
        delete this.rooms[roomName];
      }
    }
  }

  getPlayerBySocketId(socketId) {
    for (const players of Object.values(this.rooms)) {
      for (const player of players) {
        if (player.socketId === socketId) {
          return player;
        }
      }
    }
    return null;
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
