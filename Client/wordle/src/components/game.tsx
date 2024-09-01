"use client";

import React, { useState, useEffect, useCallback } from 'react';
import './game.css';
import Keyboard from './keyboard';
import EventBus from './eventbus';
import { Button } from '@mui/material';
import AllWords, { answers } from './word';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface BlockProps {
  letter: string | undefined;
  state: string;
  isFilled: boolean;
  isRevealed: boolean;
}

const Block: React.FC<BlockProps> = ({
  letter,
  state,
  isFilled,
  isRevealed,
}) => {
  const filled = isFilled ? " filled" : "";
  const revealed = isRevealed ? " revealed" : "";

  return (
    <div className={`block ${filled}${revealed}`}>
      <div className="front">{letter}</div>
      <div className={`back ${state}`}>{letter}</div>
    </div>
  );
};

interface GameState {
  keyword: string;
  current_row: number;
  current_index: number;
  letter_count: number;
  row_count: number;
  userfill: Array<Array<{ letter: string | undefined; state: string }>>;
  popup: string;
  game_state: number;
  result: { player: string; opponent?: string } | undefined;
}


const Game: React.FC = () => {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [gameState, setGameState] = useState<GameState>({
    keyword: '',
    current_row: 0,
    current_index: 0,
    letter_count: 5,
    row_count: 6,
    userfill: [],
    popup: '',
    game_state: 0,
    result: undefined
  });

  useEffect(() => {
    const keyword = answers[Math.floor(Math.random() * answers.length)];
    const userfill = Array(6).fill(null).map(() =>
      Array(5).fill({ letter: undefined, state: '' })
    );

    setGameState(prevState => ({
      ...prevState,
      keyword,
      letter_count: keyword.length,
      userfill
    }));

    console.log("keyword", keyword);
  }, []);

  useEffect(() => {
    const keyword = answers[Math.floor(Math.random() * answers.length)];
    const userfill = Array(6)
      .fill(null)
      .map(() => Array(5).fill({ letter: undefined, state: "" }));

    setGameState((prevState) => ({
      ...prevState,
      keyword,
      letter_count: keyword.length,
      userfill,
    }));

    console.log("keyword", keyword);
  }, []);

  const keyboardInput = (data: { key: string }) => {
    if (data) {
      setGameState((prevState) => {
        let newState = { ...prevState };

        if (data.key === "Backspace") {
          if (newState.current_index > 0) {
            newState.current_index--;
            updateBlock(
              newState.current_row,
              newState.current_index,
              undefined,
              ""
            );
          }
        } else if (data.key === "Enter") {
          if (newState.current_index >= newState.letter_count) {
            if (AllWords.includes(getFullWordOfRow(newState.current_row))) {
              checkMatchKeyword();
              // Move the row increment inside checkMatchKeyword to avoid incorrect increments
            } else {
              showPopup("The word is not in word list");
            }
          } else {
            showPopup("The block is not full-filled");
          }
        } else {
          if (newState.current_index < newState.letter_count) {
            updateBlock(
              newState.current_row,
              newState.current_index,
              data.key,
              ""
            );
            newState.current_index++;
          }
        }

        return newState;
      });
    }
  };

  const updateBlock = (
    row: number,
    col: number,
    letter: string | undefined,
    state: string
  ) => {
    setGameState((prevState) => {
      const newFill = [...prevState.userfill];
      newFill[row][col] = { letter, state };
      return { ...prevState, userfill: newFill };
    });
  };

  const checkMatchKeyword = () => {
    setGameState((prevState) => {
      let newState = { ...prevState };
      const row_index = newState.current_row; // Current row to process
      newState.current_index = 0; // Reset index after processing

      const target_row = newState.userfill[row_index];
      let correct = 0;
      let keywordArr = newState.keyword.split("");
      let checkedPositions = Array(newState.letter_count).fill(false);

      // First pass: Check for correct positions
      for (let i = 0; i < newState.letter_count; i++) {
        if (target_row[i].letter === newState.keyword.charAt(i)) {
          correct++;
          updateBlock(row_index, i, target_row[i].letter, "correct");
          keywordArr[i] = ""; // Mark the letter as used
          checkedPositions[i] = true;
        }
      }

      // Second pass: Check for present letters
      for (let i = 0; i < newState.letter_count; i++) {
        if (!checkedPositions[i]) {
          const letterIndex = keywordArr.indexOf(target_row[i].letter || "");
          if (letterIndex !== -1) {
            updateBlock(row_index, i, target_row[i].letter, "present");
            keywordArr[letterIndex] = ""; // Mark the letter as used
          } else {
            updateBlock(row_index, i, target_row[i].letter, "absent");
          }
        }
      }

      // Only increment the row here after all checks
      newState.current_row++;

      if (correct >= newState.letter_count) {
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => updateGameState(1), 1500);
      } else if (newState.current_row >= newState.row_count) {
        showPopup("All Chances are used");
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => updateGameState(-1), 1500);
      }

      return newState;
    });
  };

  const updateResult = (playerResult: string, opponentResult: string) => {
    setGameState((prevState) => ({
      ...prevState,
      result: { player: playerResult, opponent: opponentResult },
    }));
  };

  const updateGameState = (state: number) => {
    setGameState((prevState) => {
      if (prevState.game_state === 0) {
        return { ...prevState, game_state: state };
      }
      return prevState;
    });
  };

  const getResult = (
    board: Array<Array<{ letter: string | undefined; state: string }>>
  ) => {
    let result = "";
    for (let i = 0; i < gameState.row_count; i++) {
      for (let j = 0; j < gameState.letter_count; j++) {
        if (board[i][j].state === "correct") {
          result += "🟩";
        } else if (board[i][j].state === "present") {
          result += "🟨";
        } else if (board[i][j].state === "absent") {
          result += "⬜";
        }
      }
      result += "\n";
    }
    return result;
  };

  const getFullWordOfRow = (row: number) => {
    return gameState.userfill[row].map((block) => block.letter).join("");
  };

  const showPopup = (msg: string) => {
    setGameState((prevState) => ({ ...prevState, popup: msg }));
    setTimeout(() => {
      setGameState((prevState) => ({ ...prevState, popup: "" }));
    }, 1500);
  };

  const blocks = gameState.userfill.map((row, i) => (
    <div className="row" key={`row${i}`}>
      {row.map((block, j) => (
        <Block
          key={i * gameState.letter_count + j}
          letter={block.letter}
          state={block.state}
          isFilled={block.letter !== undefined}
          isRevealed={block.state !== ""}
        />
      ))}
    </div>
  ));

  return (
    <div id="game-container">
      <div id="board-container">
        <div id="board">{blocks}</div>
      </div>
      <Keyboard keyref={keyboardInput} />
      <div className="popup-msg">{gameState.popup}</div>
      {gameState.game_state !== 0 && (
        <div className="layer">
          <div className="dialog">
            {gameState.game_state === 1 && "You Win!"}
            {gameState.game_state === -1 && "You Lose!"}
            {gameState.game_state === 2 && "Tie!"}
            <br />
            Answer: {gameState.keyword}
            <br />
            Result
            <br />
            {gameState.result?.player}
            <Link href={from}>EXIT</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
