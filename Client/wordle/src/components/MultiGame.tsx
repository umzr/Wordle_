"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./game.css";
import Keyboard from "./keyboard";
import AllWords from "./word";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Server from "./Mserver";
import { BlockProps, MultiGameProps, MultiGameState } from "@/Types/game";

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

const MultiGame: React.FC<MultiGameProps> = ({
  keyword,
  resultdef,
  gamestatedef,
}) => {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [gameState, setGameState] = useState<MultiGameState>(() => ({
    keyword,
    current_row: 0,
    current_index: 0,
    letter_count: keyword.length,
    row_count: 6,
    userfill: Array(6)
      .fill(null)
      .map(() => Array(keyword.length).fill({ letter: undefined, state: "" })),
    popup: "",
    game_state: 0,
    result: undefined,
    opponent: {
      current_row: 0,
      userfill: Array(6)
        .fill(null)
        .map(() =>
          Array(keyword.length).fill({ letter: undefined, state: "" })
        ),
    },
  }));

  useEffect(() => {
    console.log("Initialized gameState with keyword:", gameState.keyword);
    Server.receiveOpponentState((data) => {
      opponentChange(data);
    });

    return () => {
      Server.clearServer();
    };
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

  const opponentChange = useCallback(
    (data: { row: number; word: string }) => {
      console.log("opponentChange", data);
      setGameState((prevState) => {
        if (data.row === prevState.opponent.current_row) {
          const newState = { ...prevState };
          newState.opponent.current_row++;
          let correct = 0;

          for (let i = 0; i < data.word.length; i++) {
            switch (data.word.charAt(i)) {
              case "c":
                correct++;
                newState.opponent.userfill[data.row][i] = {
                  letter: undefined,
                  state: "correct",
                };
                break;
              case "p":
                newState.opponent.userfill[data.row][i] = {
                  letter: undefined,
                  state: "present",
                };
                break;
              case "a":
                newState.opponent.userfill[data.row][i] = {
                  letter: undefined,
                  state: "absent",
                };
                break;
            }
          }

          if (correct >= newState.letter_count) {
            resultdef(
              getResult(newState.userfill),
              getResult(newState.opponent.userfill)
            );
            setTimeout(() => {
              gamestatedef(-1);
            }, 1500);
          }

          if (newState.opponent.current_row >= newState.row_count) {
            if (!checkTie(newState)) {
              showPopup("Your opponent used all chances. Hurry up!");
            } else {
              resultdef(
                getResult(newState.userfill),
                getResult(newState.opponent.userfill)
              );
              setTimeout(() => {
                gamestatedef(0);
              }, 1500);
            }
          }

          return newState;
        }
        return prevState;
      });
    },
    [resultdef, gamestatedef]
  );

  const checkTie = useCallback(
    (state: MultiGameState) => {
      if (
        state.opponent.current_row >= state.row_count &&
        state.current_row >= state.row_count
      ) {
        showPopup("Game Tie!");
        resultdef(
          getResult(state.userfill),
          getResult(state.opponent.userfill)
        );
        setTimeout(() => {
          gamestatedef(2);
        }, 1500);
        return true;
      }
      return false;
    },
    [resultdef, gamestatedef]
  );

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
        setTimeout(() => {
          setGameState(prev => ({ ...prev, game_state: 1 }));
          gamestatedef(1);
        }, 1500);
        showPopup("Correct! You win!");
      } else if (newState.current_row >= newState.row_count) {
        showPopup("Game over. The word was: " + newState.keyword);
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => {
          setGameState(prev => ({ ...prev, game_state: -1 }));
          gamestatedef(-1);
        }, 1500);
      }

      // Send the result to the server
      Server.submitWords(getFullStateOfRow(row_index), row_index, newState.userfill);
  
      return newState;
    });
  }, [updateBlock, showPopup, getResult, gamestatedef]);

  const getFullStateOfRow = useCallback(
    (row: number) => {
      return gameState.userfill[row]
        .map((block) => {
          switch (block.state) {
            case "correct":
              return "c";
            case "present":
              return "p";
            case "absent":
              return "a";
            default:
              return "";
          }
        })
        .join("");
    },
    [gameState.userfill]
  );

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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

  const opponentBlocks = gameState.opponent.userfill.map((row, i) => (
    <div className="row" key={`opponent-row${i}`}>
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
        <div id="opponent-board">
          <div id="opponent">{opponentBlocks}</div>
          Opponent's
        </div>
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
            Your Result
            <br />
            {gameState.result?.player}
            <br />
            Opponent's Result
            <br />
            {getResult(gameState.opponent.userfill)}
            <Link href={from}>EXIT</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiGame;