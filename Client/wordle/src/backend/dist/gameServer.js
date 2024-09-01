"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const word_1 = __importDefault(require("./word"));
const socketPORT = process.env.SOCKET_PORT || 4500;
class GameServer {
    constructor(server) {
        this.onlineplayers = [];
        const httpServer = server || (0, http_1.createServer)();
        const options = {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        };
        this.io = new socket_io_1.Server(httpServer, options);
        this.io.on('connection', this.handleConnection.bind(this));
        if (!server) {
            httpServer.listen(socketPORT, () => {
                console.log(`(socket) listening on *:${socketPORT}`);
            });
        }
    }
    handleConnection(socket) {
        console.log('user in', socket.id);
        socket.on('waitRoom', (data) => this.handleWaitRoom(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }
    handleWaitRoom(socket, data) {
        console.log('(waitRoom): ' + socket.id);
        if (!this.onlineplayers.some(p => p.socketid === socket.id)) {
            if (this.onlineplayers.length > 0) {
                this.createGameRoom(socket, data);
            }
            else {
                this.addToWaitingList(socket, data);
            }
            this.setupCleanupListener(socket);
        }
        else {
            console.log('(waitRoom): user exist: ' + socket.id);
        }
    }
    createGameRoom(socket, data) {
        const opponent = this.onlineplayers.pop();
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
    getKeyword(keyword) {
        if (keyword === undefined) {
            return word_1.default[Math.floor(Math.random() * word_1.default.length)];
        }
        return keyword;
    }
    setupGameListeners(socket, opponentId) {
        var _a;
        const handleSubmitWord = (data) => {
            console.log('(submitWord)', data);
            this.io.to(opponentId).emit('opponentState', {
                row: data.row,
                word: data.word,
                board: data.board
            });
        };
        socket.on('submitWord', handleSubmitWord);
        (_a = this.io.sockets.sockets.get(opponentId)) === null || _a === void 0 ? void 0 : _a.on('submitWord', (data) => {
            handleSubmitWord(data);
            socket.emit('opponentState', {
                row: data.row,
                word: data.word,
                board: data.board
            });
        });
    }
    addToWaitingList(socket, data) {
        this.onlineplayers.push({
            socketid: socket.id,
            userid: data.userid,
            keyword: data.keyword,
            rating: data.rating
        });
        console.log("Now online: ", this.onlineplayers);
    }
    setupCleanupListener(socket) {
        socket.on('cleanServer', () => {
            socket.removeAllListeners("submitWord");
            socket.removeAllListeners("submitResult");
            this.onlineplayers = this.onlineplayers.filter(p => p.socketid !== socket.id);
            socket.removeAllListeners('cleanServer');
        });
    }
    handleDisconnect(socket) {
        console.log("A player disconnect:" + socket.id);
        this.onlineplayers = this.onlineplayers.filter(p => p.socketid !== socket.id);
    }
}
// Create and export an instance if this file is run directly
if (require.main === module) {
    new GameServer();
}
exports.default = GameServer;
