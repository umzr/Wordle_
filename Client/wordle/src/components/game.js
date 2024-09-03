import React, { useState, useEffect, useCallback } from "react";
import "./game.css";
import Keyboard from "./keyboard";
import EventBus from "./eventbus";
import Block from "./block";
import AllWords from "./word";
import { answers } from "./word";

const Game = () => {
  // Initialize state using useState hook
  const [keyword, setKeyword] = useState("");
  const [currentRow, setCurrentRow] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [letterCount, setLetterCount] = useState(0);
  const [rowCount] = useState(6);
  const [userFill, setUserFill] = useState([]);
  const [popup, setPopup] = useState("");
  const [gameState, setGameState] = useState(0);
  const [result, setResult] = useState(undefined);

  useEffect(() => {
    // Set keyword and initialize letter count
    const selectedKeyword = answers[Math.floor(Math.random() * answers.length)];
    console.log("Selected keyword:", selectedKeyword);
    setKeyword(selectedKeyword);
    setLetterCount(selectedKeyword.length);

    // Initialize game board
    const initialBoard = Array(rowCount)
      .fill(null)
      .map(() =>
        Array(selectedKeyword.length).fill({
          letter: undefined,
          state: "",
        })
      );
    setUserFill(initialBoard);
  }, []); // Empty dependency array means this effect runs once on mount

  const updateBlock = (row, col, letter, state) => {
    setUserFill((prevFill) => {
      const newFill = prevFill.map((r) => [...r]);
      newFill[row][col] = { letter, state };
      return newFill;
    });
  };

  const checkMatchKeyword = useCallback(() => {
    setCurrentRow((prevRow) => {
      const newRow = prevRow + 1;
      setCurrentIndex(0);
      const target_row = userFill[prevRow];
      let correctCount = 0;

      for (let i = 0; i < letterCount; i++) {
        if (target_row[i].letter === keyword.charAt(i)) {
          updateBlock(prevRow, i, target_row[i].letter, "correct");
          correctCount++;
        } else if (keyword.includes(target_row[i].letter)) {
          updateBlock(prevRow, i, target_row[i].letter, "present");
        } else {
          updateBlock(prevRow, i, target_row[i].letter, "absent");
        }
      }

      // Check for win condition
      if (correctCount === letterCount) {
        setGameState("won");
        setResult(
          `Congratulations! You guessed the word in ${newRow} ${
            newRow === 1 ? "try" : "tries"
          }!`
        );
      } else if (newRow >= rowCount) {
        setGameState("lost");
        setResult(`Game over! The word was "${keyword}".`);
      }

      return newRow;
    });
  }, [keyword, letterCount, userFill, updateBlock, rowCount]);

  const getFullWordOfRow = (row) => {
    return userFill[row].map((cell) => cell.letter || "").join("");
  };

  useEffect(() => {
    const handleCustomKeyDown = (data) => {
      console.log("CustomKeyDown", data);
      if (data) {
        if (data.key === "Backspace") {
          if (currentIndex > 0) {
            setCurrentIndex((prevIndex) => {
              const newIndex = prevIndex - 1;
              updateBlock(currentRow, newIndex, undefined, "");
              return newIndex;
            });
          }
        } else if (data.key === "Enter") {
          if (currentIndex >= letterCount) {
            if (AllWords.includes(getFullWordOfRow(currentRow))) {
              checkMatchKeyword();
            } else {
              console.log("The word is not in word list");
            }
          } else {
            console.log("The block is not full-filled");
          }
        } else {
          if (currentIndex <= letterCount - 1) {
            updateBlock(currentRow, currentIndex, data.key, "");
            setCurrentIndex((prevIndex) => prevIndex + 1);
          }
        }
      }
    };

    // Add event listener
    EventBus.on("CustomKeyDown", handleCustomKeyDown);

    // Cleanup function to remove the event listener
    return () => {
      EventBus.off("CustomKeyDown", handleCustomKeyDown);
    };
  }, [currentRow, letterCount, currentIndex, userFill, keyword]); // Dependencies based on your logic

  // Create blocks array using for loop
  const blocks = [];
  for (let i = 0; i < rowCount; i++) {
    let blocks_row = [];
    for (let j = 0; j < letterCount; j++) {
      blocks_row.push(
        <Block
          key={i * letterCount + j}
          letter={userFill[i]?.[j]?.letter}
          state={userFill[i]?.[j]?.state}
          isFilled={userFill[i]?.[j]?.letter !== undefined}
          isRevealed={userFill[i]?.[j]?.state !== ""}
        />
      );
    }
    blocks.push(
      <div className="row" key={"row" + i}>
        {blocks_row}
      </div>
    );
  }

  return (
    <div id="game-container">
      <div id="board-container">
        <div id="board">{blocks}</div>
      </div>
      {result && (
        <div id="result-container">
          <p>{result}</p>
        </div>
      )}
      <Keyboard />
    </div>
  );
};

export default Game;
