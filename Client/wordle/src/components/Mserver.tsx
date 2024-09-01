import { io, Socket } from "socket.io-client";
import axios from "axios";
import {
  ServerState,
  GameRoomData,
  SubmitWordData,
  RatingData,
} from "@/Types/server";

const URL = "http://localhost:4500"; // or whatever port you choose for Socket.IO

class Server {
  private socket: Socket;
  private state: ServerState;

  constructor() {
    this.socket = io(URL);
    this.state = {
      opponentId: null,
      rating: null,
      wordrating: null,
      opponentrating: null,
      opponentRow: -1,
    };

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on("gameRoom", (data: GameRoomData) => {
      console.log("(gameRoom): ", data);
      this.state.opponentId = data.opponent.socketid;
      this.state.opponentrating = data.opponent.rating || 1501;
      // Handle gameRoom data
    });

    this.socket.on("opponentState", (data: { row: number; word: string }) => {
      if (
        this.state.opponentRow < data.row &&
        data.row - this.state.opponentRow === 1
      ) {
        this.state.opponentRow = data.row;
        console.log("(opponentState): ", data);
        // Handle opponent state update
      }
    });
  }

  async waitRoom(
    auth: { userid: string },
    callback: (data: GameRoomData) => void
  ) {
    console.log("(waitRoom)");
    this.resetState();

    try {
      const response = await axios.get(`/game/${auth.userid}`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      console.log("response", response);
      this.state.wordrating = response.data.wordrating || 1501;
      this.state.rating = response.data.rating || 1501;

      this.socket.emit("waitRoom", {
        userid: auth.userid,
        keyword: response.data.keyword,
        rating: response.data.rating,
      });

      this.socket.once("gameRoom", (data: GameRoomData) => {
        callback(data);
      });
    } catch (err) {
      console.log("get player data fail", err);
      if (auth.userid) {
        this.socket.emit("waitRoom", { userid: auth.userid });
      }
    }
  }

  receiveOpponentState(
    callback: (data: { row: number; word: string }) => void
  ) {
    this.state.opponentRow = -1;
    this.socket.on("opponentState", (data: { row: number; word: string }) => {
      if (
        this.state.opponentRow < data.row &&
        data.row - this.state.opponentRow === 1
      ) {
        this.state.opponentRow = data.row;
        console.log("(opponentState): ", data);
        callback(data);
      }
    });
  }

  submitWords(word: string, row: number, board: any) {
    const data: SubmitWordData = {
      row,
      word,
      opponentId: this.state.opponentId,
    };
    console.log("submitWord", data);
    this.socket.emit("submitWord", data);
  }

  async submitResult(
    auth: string,
    gameState: number,
    updateAuthRef: Function,
    word: string
  ) {
    const rating: RatingData = {
      userid: auth,
      gameState,
      rating: this.state.rating,
      wordrating: this.state.wordrating,
      opponentrating: this.state.opponentrating,
      word,
    };

    console.log("(submitResult)", rating);

    try {
      const response = await axios.post(
        "/game/rating/update",
        JSON.stringify(rating),
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("response", response);
      updateAuthRef(
        response.data.rating,
        response.data.wincount,
        response.data.losecount
      );
    } catch (err) {
      console.log("submitResult fail", err);
    }
  }

  clearServer() {
    this.socket.emit("cleanServer", {});
  }

  private resetState() {
    this.state = {
      opponentId: null,
      rating: null,
      wordrating: null,
      opponentrating: null,
      opponentRow: -1,
    };
  }
}

export default new Server();
