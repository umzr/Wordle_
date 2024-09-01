"use client";

import React, { useState, useEffect, useCallback } from "react";
import "./game.css";
import Keyboard from "./keyboard";
import AllWords from "./word";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Server from "./Mserver";
import { BlockProps, MultiGameProps, MultiGameState } from "@/Types/game";
import { CircularProgress } from "@mui/material";

// Block Component for each cell in the game board
const Block: React.FC<BlockProps> = ({
  letter,
  state,
  isFilled,
  isRevealed,
}) => {
  return (
    <div
      className={`block ${isFilled ? "filled" : ""} ${
        isRevealed ? "revealed" : ""
      }`}
    >
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

  const [loading, setLoading] = useState(true); // Add loading state

  // State Initialization
  const [gameState, setGameState] = useState<MultiGameState>(() => ({
    keyword,
    current_row: 0,
    current_index: 0,
    letter_count: keyword.length,
    row_count: 6,
    userfill: Array.from({ length: 6 }, () =>
      Array(keyword.length).fill({ letter: undefined, state: "" })
    ),
    popup: "",
    game_state: 0,
    result: undefined,
    opponent: {
      current_row: 0,
      userfill: Array.from({ length: 6 }, () =>
        Array(keyword.length).fill({ letter: undefined, state: "" })
      ),
    },
  }));

  // Setup and Cleanup Socket Listeners
  useEffect(() => {
    console.log("Initialized gameState with keyword:", gameState.keyword);

    Server.connect(); // Ensure socket is connected

    // Listen for opponent state changes
    Server.receiveOpponentState((data) => {
      opponentChange(data);
    });

    // Start game once server signals readiness
    Server.onGameStart(() => {
      setLoading(false); // Stop loading when the game starts
    });

    return () => {
      Server.clearServer();
      Server.disconnect(); // Cleanup when component unmounts
    };
  }, [gameState.keyword]);

  // Handle Opponent's State Changes
  const opponentChange = useCallback(
    (data: { row: number; word: string }) => {
      console.log("opponentChange", data);
      setGameState((prevState) => {
        if (data.row === prevState.opponent.current_row) {
          const newOpponentFill = prevState.opponent.userfill.map(
            (rowFill, i) =>
              i === data.row
                ? rowFill.map((block, j) => {
                    switch (data.word.charAt(j)) {
                      case "c":
                        return { letter: undefined, state: "correct" };
                      case "p":
                        return { letter: undefined, state: "present" };
                      case "a":
                        return { letter: undefined, state: "absent" };
                      default:
                        return block;
                    }
                  })
                : rowFill
          );

          const newState = {
            ...prevState,
            opponent: {
              ...prevState.opponent,
              current_row: prevState.opponent.current_row + 1,
              userfill: newOpponentFill,
            },
          };

          // Check for Correct Guess
          let correct = newOpponentFill[data.row].filter(
            (block) => block.state === "correct"
          ).length;

          if (correct >= newState.letter_count) {
            resultdef(
              getResult(newState.userfill),
              getResult(newState.opponent.userfill)
            );
            setTimeout(() => {
              gamestatedef(-1); // Opponent wins
            }, 1500);
          }

          // Check if Opponent Used All Rows
          if (newState.opponent.current_row >= newState.row_count) {
            if (!checkTie(newState)) {
              showPopup("Your opponent used all chances. Hurry up!");
            } else {
              resultdef(
                getResult(newState.userfill),
                getResult(newState.opponent.userfill)
              );
              setTimeout(() => {
                gamestatedef(0); // Game Tie
              }, 1500);
            }
          }

          return newState;
        }
        return prevState;
      });
    },
    [resultdef, gamestatedef, checkTie, getResult, showPopup]
  );

  // Check for Tie Condition
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
    [resultdef, gamestatedef, getResult, showPopup]
  );

  // Check if Player's Guess Matches the Keyword
  const checkMatchKeyword = useCallback(() => {
    setGameState((prevState) => {
      let newState = { ...prevState };
      const row_index = newState.current_row;
      const target_row = newState.userfill[row_index];
      const guessedWord = target_row
        .map((block) => block.letter)
        .join("")
        .toLowerCase();

      console.log("Checking word:", guessedWord);
      console.log("Current keyword:", newState.keyword);

      if (!AllWords.includes(guessedWord)) {
        console.log(guessedWord, "is not in the word list");
        showPopup("Not in word list");
        return prevState;
      }

      let correct = 0;
      let keywordArr = newState.keyword.toLowerCase().split("");
      let checkedPositions = Array(newState.letter_count).fill(false);

      // First pass: Check for correct positions
      for (let i = 0; i < newState.letter_count; i++) {
        if (guessedWord[i] === newState.keyword[i].toLowerCase()) {
          correct++;
          updateBlock(row_index, i, target_row[i].letter, "correct");
          keywordArr[i] = "";
          checkedPositions[i] = true;
        }
      }

      // Second pass: Check for present letters
      for (let i = 0; i < newState.letter_count; i++) {
        if (!checkedPositions[i]) {
          const letterIndex = keywordArr.indexOf(guessedWord[i]);
          if (letterIndex !== -1) {
            updateBlock(row_index, i, target_row[i].letter, "present");
            keywordArr[letterIndex] = "";
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
          setGameState((prev) => ({ ...prev, game_state: 1 }));
          gamestatedef(1);
        }, 1500);
        showPopup("Correct! You win!");
      } else if (newState.current_row >= newState.row_count) {
        showPopup("Game over. The word was: " + newState.keyword);
        newState.result = { player: getResult(newState.userfill) };
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, game_state: -1 }));
          gamestatedef(-1);
        }, 1500);
      }

      // Send the result to the server
      Server.submitWords(
        getFullStateOfRow(row_index),
        row_index,
        newState.userfill
      );

      return newState;
    });
  }, [updateBlock, showPopup, getResult, gamestatedef]);

  // Update Block State
  const updateBlock = useCallback(
    (row: number, col: number, letter: string | undefined, state: string) => {
      setGameState((prevState) => {
        const newFill = prevState.userfill.map((rowFill, i) =>
          i === row
            ? rowFill.map((block, j) => (j === col ? { letter, state } : block))
            : rowFill
        );
        return { ...prevState, userfill: newFill };
      });
    },
    []
  );

  // Show Popup Message
  const showPopup = useCallback((msg: string) => {
    setGameState((prevState) => ({ ...prevState, popup: msg }));
    setTimeout(() => {
      setGameState((prevState) => ({ ...prevState, popup: "" }));
    }, 1500);
  }, []);

  // Get Full Word of a Specific Row
  const getFullWordOfRow = useCallback(
    (row: number) =>
      gameState.userfill[row].map((block) => block.letter || "").join(""),
    [gameState.userfill]
  );

  // Calculate Result Based on Board State
  const getResult = useCallback(
    (board: Array<Array<{ letter: string | undefined; state: string }>>) => {
      return board
        .map((row) =>
          row
            .map((block) => {
              switch (block.state) {
                case "correct":
                  return "🟩";
                case "present":
                  return "🟨";
                case "absent":
                  return "⬜";
                default:
                  return "";
              }
            })
            .join("")
        )
        .join("\n");
    },
    []
  );

  // Get the Full State of a Specific Row
  const getFullStateOfRow = useCallback(
    (row: number) =>
      gameState.userfill[row]
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
        .join(""),
    [gameState.userfill]
  );

  // Handle Keyboard Input for the Game
  const keyboardInput = useCallback(
    (data: { key: string }) => {
      if (data) {
        setGameState((prevState) => {
          let newState = { ...prevState };
          console.log("Key pressed:", data.key);
          console.log("Current row:", newState.current_row);
          console.log("Current index:", newState.current_index);

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
            if (newState.current_index === newState.letter_count) {
              checkMatchKeyword();
            } else {
              showPopup("Not enough letters");
            }
          } else if (data.key.length === 1 && /^[a-zA-Z]$/.test(data.key)) {
            if (newState.current_index < newState.letter_count) {
              updateBlock(
                newState.current_row,
                newState.current_index,
                data.key.toUpperCase(),
                ""
              );
              newState.current_index++;
            }
          }

          return newState;
        });
      }
    },
    [updateBlock, showPopup, checkMatchKeyword]
  );

  // Add Event Listeners for Keyboard Input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ["Backspace", "Enter"].includes(event.key) ||
        /^[a-zA-Z]$/.test(event.key)
      ) {
        event.preventDefault();
        keyboardInput({ key: event.key });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keyboardInput]);

  // Render the Game Board and Opponent Board
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

  // Main Render Function
  return (
    <div id="game-container">
      <>
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
      </>
    </div>
  );
};

export default MultiGame;
