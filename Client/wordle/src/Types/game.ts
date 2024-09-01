export interface BlockProps {
  letter: string | undefined;
  state: string;
  isFilled: boolean;
  isRevealed: boolean;
}

export interface GameState {
  keyword: string;
  current_row: number;
  current_index: number;
  letter_count: any;
  row_count: number;
  userfill: Array<Array<{ letter: string | undefined; state: string }>>;
  popup: string;
  game_state: number;
  result: { player: string; opponent?: string } | undefined;
}

export interface MultiGameState extends GameState {
  opponent: {
    current_row: number;
    userfill: Array<Array<{ letter: string | undefined; state: string }>>;
  };
}

export interface MultiGameProps {
  keyword: string;
  resultdef: (playerResult: string, opponentResult: string) => void;
  gamestatedef: (state: number) => void;
}
