
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import AllWords from './word';

const socketPORT = process.env.SOCKET_PORT || 4500;

interface OnlinePlayer {
  socketid: string;
  userid: string;
  keyword?: string;
  rating?: number;
}

class GameServer {

  private io: SocketIOServer;
  private onlineplayers: OnlinePlayer[] = [];
  
  constructor(server?: HTTPServer) {
    const httpServer = server || createServer();
    const options = { 
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    };
    this.io = new SocketIOServer(httpServer, options);

    this.io.on('connection', this.handleConnection.bind(this));

    if (!server) {
      httpServer.listen(socketPORT, () => {
        console.log(`(socket) listening on *:${socketPORT}`);
      });
    }
  }

  private handleConnection(socket: Socket) {
    console.log('user in', socket.id);

    socket.on('waitRoom', (data) => this.handleWaitRoom(socket, data));
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private handleWaitRoom(socket: Socket, data: any) {
    console.log('(waitRoom): ' + socket.id);
    if (!this.onlineplayers.some(p => p.socketid === socket.id)) {
      if (this.onlineplayers.length > 0) {
        this.createGameRoom(socket, data);
      } else {
        this.addToWaitingList(socket, data);
      }
      this.setupCleanupListener(socket);
    } else {
      console.log('(waitRoom): user exist: ' + socket.id);
    }
  }

  private createGameRoom(socket: Socket, data: any) {
    const opponent = this.onlineplayers.pop()!;
    console.log("Now online: ", this.onlineplayers);
    console.log("New Game Room: " + socket.id + '|' + opponent.socketid);

    const player_keyword = this.getKeyword(data.keyword);
    const opponent_keyword = this.getKeyword(opponent.keyword);

    this.io.to(opponent.socketid).emit('gameRoom', {
      word: opponent_keyword,
      opponent: {
        socketid: socket.id,
        rating: data.rating
      }
    });
    socket.emit('gameRoom', {
      word: player_keyword,
      opponent: {
        socketid: opponent.socketid,
        rating: opponent.rating
      }
    });

    this.setupGameListeners(socket, opponent.socketid);
  }

  private getKeyword(keyword?: string) {
    if (keyword === undefined) {
      return AllWords[Math.floor(Math.random() * AllWords.length)];
    }
    return keyword;
  }

  private setupGameListeners(socket: Socket, opponentId: string) {
    const handleSubmitWord = (data: any) => {
      console.log('(submitWord)', data);
      this.io.to(opponentId).emit('opponentState', {
        row: data.row,
        word: data.word,
        board: data.board
      });
    };

    socket.on('submitWord', handleSubmitWord);
    this.io.sockets.sockets.get(opponentId)?.on('submitWord', (data) => {
      handleSubmitWord(data);
      socket.emit('opponentState', {
        row: data.row,
        word: data.word,
        board: data.board
      });
    });
  }

  private addToWaitingList(socket: Socket, data: any) {
    this.onlineplayers.push({
      socketid: socket.id,
      userid: data.userid,
      keyword: data.keyword,
      rating: data.rating
    });
    console.log("Now online: ", this.onlineplayers);
  }

  private setupCleanupListener(socket: Socket) {
    socket.on('cleanServer', () => {
      socket.removeAllListeners("submitWord");
      socket.removeAllListeners("submitResult");
      this.onlineplayers = this.onlineplayers.filter(p => p.socketid !== socket.id);
      socket.removeAllListeners('cleanServer');
    });
  }

  private handleDisconnect(socket: Socket) {
    console.log("A player disconnect:" + socket.id);
    this.onlineplayers = this.onlineplayers.filter(p => p.socketid !== socket.id);
  }
}

// Create and export an instance if this file is run directly
if (require.main === module) {
  new GameServer();
}

export default GameServer;



