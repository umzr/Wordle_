import { io, Socket } from "socket.io-client";
import axios from "axios";
import {
  ServerState,
  GameRoomData,
  SubmitWordData,
  RatingData,
} from "@/Types/server";

const URL = "http://localhost:4500"; // Ensure this matches your server URL and port

class Server {
  public socket: Socket; // Make socket public for direct access
  private state: ServerState;

  constructor() {
    this.socket = io(URL, {
      autoConnect: false, // Prevent auto-connect on instantiation
    });
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
    this.socket.on("connect", () => {
      console.log("Connected to the socket server");
    });

    this.socket.on("gameRoom", (data: GameRoomData) => {
      console.log("(gameRoom): ", data);
      this.state.opponentId = data.opponent.socketId;
      this.state.opponentrating = data.opponent.rating || 1501;
    });

    this.socket.on("opponentState", (data: { row: number; word: string }) => {
      if (
        this.state.opponentRow < data.row &&
        data.row - this.state.opponentRow === 1
      ) {
        this.state.opponentRow = data.row;
        console.log("(opponentState): ", data);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from the socket server");
    });

    this.socket.on("roomDetails", (data) => {
      console.log("Received room details:", data); // Log received data
    });
  }

  public connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  async waitRoom(
    auth: { userid: string },
    callback: (data: GameRoomData) => void
  ) {
    console.log("(waitRoom)");
    this.resetState();
    this.connect();
    console.log("auth", auth);
    try {
      this.socket.emit("waitRoom", { userid: auth.userid });
      this.socket.once("gameRoom", (data: GameRoomData) => {
        console.log("Received gameRoom event:", data); // Log received data
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
