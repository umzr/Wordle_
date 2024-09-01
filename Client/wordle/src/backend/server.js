const socketPORT = process.env.PORT+1000 || 4500;
const answers = require('./word');

console.log(socketPORT)


class Server {

  constructor() {
      const server = require('http').createServer();
      const options = { cors:true,
      origins:"*"};
      const io = require('socket.io')(server,options);
      this.io = io;
      this.onlineplayers = [];

      io.on('connection', socket => {

          console.log('user in',socket.id)
          socket.on('waitRoom', data => {
              console.log('(waitRoom): '+socket.id);
              if(!this.onlineplayers.filter(p => p.socketid == socket.id).length > 0){
                  if(this.onlineplayers.length > 0){
                      var opponent = this.onlineplayers.pop();
                      console.log("Now online: ",this.onlineplayers);
                      console.log("New Game Room: "+socket.id+'|'+opponent.socketid);

                      var player_keyword;
                      if(data.keyword == undefined){
                          //get answers from random
                          player_keyword = answers[Math.floor(Math.random() * answers.length)];
                          console.log('player answers',player_keyword);
                      }else{
                          player_keyword = data.keyword;
                          console.log('player answers (rating)',player_keyword);
                      }
                      var opponent_keyword;
                      if(opponent.keyword == undefined){
                          //get answers from random
                          opponent_keyword = answers[Math.floor(Math.random() * answers.length)];
                          console.log('opponent answers',opponent_keyword);
                      }else{
                          opponent_keyword = opponent.keyword;
                          console.log('opponent answers (rating)',opponent_keyword);
                      }
                      


                      io.to(opponent.socketid).emit('gameRoom', {
                          word:opponent_keyword.words,
                          opponent:{
                              socketid:socket.id,
                              rating:data.rating
                          }
                      });
                      socket.emit('gameRoom', {
                          word:player_keyword.words,
                          opponent:{
                              socketid:opponent.socketid,
                              rating:opponent.rating
                          }
                      });


                      var opponentSocket = io.sockets.sockets.get(opponent.socketid);

                      socket.on('submitWord',(data)=>{
                          console.log('(submitWord)',data);
                          io.to(opponent.socketid).emit('opponentState',{row:data.row,word:data.word,board:data.board});
                          
                      });
                      opponentSocket.on('submitWord',(data)=>{
                          console.log('(submitWord)',data);
                          socket.emit('opponentState',{row:data.row,word:data.word,board:data.board});
                      });

                  }else{
                      this.onlineplayers.push({
                          socketid:socket.id,
                          userid:data.userid,
                          keyword:data.keyword,
                          rating:data.rating
                      });
                      console.log("Now online: ",this.onlineplayers);
                  }
                  socket.on('cleanServer',(data)=>{
                      socket.removeAllListeners("submitWord");
                      socket.removeAllListeners("submitResult");
                      delete this.onlineplayers.pop(this.onlineplayers.filter(p => p.socketid == socket.id)[0]);
                      socket.removeAllListeners('cleanServer');
                  });
              }else{
                  console.log('(waitRoom): user exist: '+socket.id);
              }

              //socket.emit('gameRoom', 'abs');
          });

          socket.on('disconnect', () => {
              console.log("A player disconnect:"+socket.id);
              delete this.onlineplayers.pop(socket.id);
              //socket.emit('exitRoom');
          });


      });

      server.listen(socketPORT, () => {
          console.log('(socket)listening on *:'+socketPORT);
      });

  }

}

let main = () => {
  let server = new Server();
};

main(); 

// import { createServer } from 'http';
// import { parse } from 'url';
// import next from 'next';
// import GameServer from './gameServer';

// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   const server = createServer((req, res) => {
//     const parsedUrl = parse(req.url!, true);
//     handle(req, res, parsedUrl);
//   });

//   // Initialize GameServer with the same server
//   new GameServer(server);

//   server.listen(3000, () => {
//     console.log('> Ready on http://localhost:3000');
//   });
// });