export interface ServerState {
  opponentId: string | null;
  rating: number | null;
  wordrating: number | null;
  opponentrating: number | null;
  opponentRow: number;
}

export interface GameRoomData {
  opponent: {
    socketid: string;
    rating: number;
  };
  keyword: string;
}

export interface SubmitWordData {
  row: number;
  word: string;
  opponentId: string | null;
}

export interface RatingData {
  userid: string;
  gameState: number;
  rating: number | null;
  wordrating: number | null;
  opponentrating: number | null;
  word: string;
}
