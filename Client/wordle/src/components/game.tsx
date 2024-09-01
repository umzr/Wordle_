"use client";

import React, { useState, useEffect, useCallback } from 'react';
import './game.css';
import Keyboard from './keyboard';
import AllWords, { answers } from './word';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface BlockProps {
  letter: string | undefined;
  state: string;
  isFilled: boolean;
  isRevealed: boolean;
}

const Block: React.FC<BlockProps> = ({ letter, state, isFilled, isRevealed }) => {
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

  const [gameState, setGameState] = useState<GameState>(() => {
    const keyword = answers[Math.floor(Math.random() * answers.length)];
    return {
      keyword,
      current_row: 0,
      current_index: 0,
      letter_count: keyword.length,
      row_count: 6,
      userfill: Array(6).fill(null).map(() => Array(keyword.length).fill({ letter: undefined, state: "" })),
      popup: '',
      game_state: 0,
      result: undefined
    };
  });

  useEffect(() => {
    console.log("Initialized gameState with keyword:", gameState.keyword);
  }, []);

  const updateBlock = useCallback((row: number, col: number, letter: string | undefined, state: string) => {
    setGameState(prevState => {
      const newFill = [...prevState.userfill];
      newFill[row][col] = { letter, state };
      return { ...prevState, userfill: newFill };
    });
  }, []);

  const showPopup = useCallback((msg: string) => {
    setGameState(prevState => ({ ...prevState, popup: msg }));
    setTimeout(() => {
      setGameState(prevState => ({ ...prevState, popup: "" }));
    }, 1500);
  }, []);

  const getFullWordOfRow = useCallback((row: number) => {
    if (gameState.userfill && Array.isArray(gameState.userfill[row])) {
      return gameState.userfill[row].map(block => block.letter || "").join("");
    }
    console.warn(`Row ${row} is out of bounds or not defined.`);
    return "";
  }, [gameState.userfill]);

  const getResult = (board: Array<Array<{ letter: string | undefined; state: string }>>) => {
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

  const checkMatchKeyword = useCallback(() => {
    setGameState(prevState => {
      let newState = { ...prevState };
      const row_index = newState.current_row;
      const target_row = newState.userfill[row_index];
      const guessedWord = target_row.map(block => block.letter).join('').toLowerCase();
      
      console.log("Checking word:", guessedWord);
      console.log("Current keyword:", newState.keyword);
  
      if (!AllWords.includes(guessedWord)) {
        console.log(guessedWord, "is not in the word list");
        showPopup("Not in word list");
        return prevState; // Return the previous state without changes
      }
  
      let correct = 0;
      let keywordArr = newState.keyword.toLowerCase().split('');
      let checkedPositions = Array(newState.letter_count).fill(false);
  
      // First pass: Check for correct positions
      for (let i = 0; i < newState.letter_count; i++) {
        if (guessedWord[i] === newState.keyword[i].toLowerCase()) {
          correct++;
          updateBlock(row_index, i, target_row[i].letter, "correct");
          keywordArr[i] = '';
          checkedPositions[i] = true;
        }
      }
  
      // Second pass: Check for present letters
      for (let i = 0; i < newState.letter_count; i++) {
        if (!checkedPositions[i]) {
          const letterIndex = keywordArr.indexOf(guessedWord[i]);
          if (letterIndex !== -1) {
            updateBlock(row_index, i, target_row[i].letter, "present");
            keywordArr[letterIndex] = '';
          } else {
            updateBlock(row_index, i, target_row[i].letter, "absent");
          }
        }
      }
  
      newState.current_row++;
      newState.current_index = 0;
  
      if (correct === newState.letter_count) {
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => setGameState(prev => ({ ...prev, game_state: 1 })), 1500);
        showPopup("Correct! You win!");
      } else if (newState.current_row >= newState.row_count) {
        showPopup("Game over. The word was: " + newState.keyword);
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => setGameState(prev => ({ ...prev, game_state: -1 })), 1500);
      }
  
      return newState;
    });
  }, [updateBlock, showPopup, getResult]);


  const keyboardInput = useCallback((data: { key: string }) => {
    if (data) {
      setGameState(prevState => {
        let newState = { ...prevState };
        console.log("Key pressed:", data.key);
        console.log("Current row:", newState.current_row);
        console.log("Current index:", newState.current_index);
  
        if (data.key === "Backspace") {
          if (newState.current_index > 0) {
            newState.current_index--;
            updateBlock(newState.current_row, newState.current_index, undefined, "");
          }
        } else if (data.key === "Enter") {
          if (newState.current_index === newState.letter_count) {
            checkMatchKeyword();
          } else {
            showPopup("Not enough letters");
          }
        } else if (data.key.length === 1 && /^[a-zA-Z]$/.test(data.key)) {
          if (newState.current_index < newState.letter_count) {
            updateBlock(newState.current_row, newState.current_index, data.key.toUpperCase(), "");
            newState.current_index++;
          }
        }
  
        return newState;
      });
    }
  }, [updateBlock, showPopup, checkMatchKeyword]);
  // Update the useEffect for keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for game-related keys
      if (['Backspace', 'Enter'].includes(event.key) || /^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        keyboardInput({ key: event.key });
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyboardInput]);


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