// https://github.com/Jerga99/next-youtube-course
const express = require("express");
const app = express();
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const PORT = process.env.PORT || 3500;
const socketPORT = process.env.PORT + 1 || 3501;
const answers = require("./word.ts");
// Cross Origin Resource Sharing
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded form data
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

class Server {
  constructor() {
    const server = require("http").createServer();
    const options = { cors: true, origins: "*" };
    const io = require("socket.io")(server, options);
    this.io = io;
    this.onlineplayers = [];

    io.on("connection", (socket) => {
      console.log("user in", socket.id);
      socket.on("waitRoom", (id) => {
        console.log("(waitRoom): " + socket.id);
        if (!this.onlineplayers.includes(socket.id)) {
          if (this.onlineplayers.length > 0) {
            var opponent = this.onlineplayers.pop();
            console.log("New Game Room: " + socket.io + "|" + opponent);
            //var answers = require('./word').;
            console.log("answers", answers);
            var answer = answers[Math.floor(Math.random() * answers.length)];
            console.log("keyword: " + answer);
            io.to(opponent).emit("gameRoom", {
              word: answer,
              opponentId: socket.id,
            });
            socket.emit("gameRoom", { word: answer, opponentId: opponent });
            //socket.off('waitRoom',waitRoom);
          } else {
            this.onlineplayers.push(socket.id);
          }
          socket.on("submitWord", (data) => {
            console.log("submitWord", data);
            io.to(data.opponentId).emit("opponentState", {
              row: data.row,
              word: data.word,
            });
          });
        } else {
          console.log("(waitRoom): user exist: " + socket.id);
        }

        //socket.emit('gameRoom', 'abs');
      });

      socket.on("disconnect", () => {
        console.log("A player disconnect:" + socket.id);
        delete this.onlineplayers.pop(socket.id);
      });
    });

    server.listen(socketPORT, () => {
      console.log("(socket)listening on *:" + socketPORT);
    });
  }
}

let main = () => {
  let server = new Server();
};

main();
