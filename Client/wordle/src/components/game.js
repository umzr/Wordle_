import React, { useState, useEffect, useCallback } from "react";
import "./game.css";
import Keyboard from "./keyboard";
import EventBus from "./eventbus";
import AllWords from "./word";
import { answers } from "./word";

// Define the Block component
const Block = ({ letter, state, isFilled, isRevealed }) => {
  const filled = isFilled ? " filled" : "";
  const revealed = isRevealed ? " revealed" : "";
  return (
    <div className={`block${filled}${revealed}`}>
      <div className="front">{letter}</div>
      <div className={`back ${state}`}>{letter}</div>
    </div>
  );
};

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

//one of 6*5 box
// class Block extends React.Component {
// 	render(){
// 		var filled = (this.props.isFilled)? ' filled' : '';
// 		var revealed = (this.props.isRevealed)?' revealed':'';
// 		return(
// 			<div className={"block "+filled+revealed}>
// 				<div className="front">
// 					{this.props.letter}
// 				</div>
// 				<div className={'back ' + this.props.state}>
// 					{this.props.letter}
// 				</div>
// 			</div>
// 		);
// 	}
// }

//Whole game
// export default class Game extends React.Component {
//   constructor(props) {
//     super(props);
//     //it should be modify by not-fixed data
//     this.state = {
//       keyword: "",
//       currentRow: 0,
//       currentIndex: 0,
//       letterCount: "".length,
//       row_count: 6,
//       userFill: undefined,
//       popup: "",
//       game_state: 0,
//       result: undefined,
//     };
//     this.state.keyword = answers[Math.floor(Math.random() * answers.length)];
//     this.state.letterCount = this.state.keyword.length;
//     //inital the 6*5 game board with null
//     this.state.userFill = Array(this.state.row_count).fill(null);
//     for (var j = 0; j < this.state.row_count; j++) {
//       this.state.userFill[j] = Array(this.state.letterCount).fill({
//         letter: undefined,
//         state: "",
//       });
//     }

//     //recevice the keyboard keydown to play game
//     EventBus.on("CustomKeyDown", (data) => {
//       //console.log("CustomKeyDown",data);
//       if (data) {
//         if (data.key == "Backspace") {
//           if (this.state.currentIndex > 0) {
//             this.state.currentIndex--;
//             this.updateBlock(
//               this.state.currentRow,
//               this.state.currentIndex,
//               undefined,
//               ""
//             );
//           }
//         } else if (data.key == "Enter") {
//           if (this.state.currentIndex >= this.state.letterCount) {
//             if (
//               AllWords.includes(this.getFullWordOfRow(this.state.currentRow))
//             ) {
//               this.checkMatchKeyword();
//             } else {
//               console.log("The word is not in word list");
//             }
//           } else {
//             console.log("The block is not full-filled");
//           }
//         } else {
//           if (this.state.currentIndex <= this.state.letterCount - 1) {
//             this.updateBlock(
//               this.state.currentRow,
//               this.state.currentIndex,
//               data.key,
//               ""
//             );
//             this.state.currentIndex++;
//           }
//           //console.log("current index: "+this.state.currentIndex+", row: "+ this.state.currentRow);
//         }
//       } else {
//         console.log("data is undefined");
//       }
//     });
//   }

//   //update one block letter and state using row and col
//   updateBlock(row, col, letter, state) {
//     console.log("updateBlock(" + row + "," + col + ") to " + letter);
//     const fill = this.state.userFill.slice();
//     fill[row][col] = {
//       letter: letter,
//       state: state,
//     };
//     this.setState({ userFill: fill });
//   }

//   //check one row is not match the answer
//   checkMatchKeyword() {
//     let row_index = this.state.currentRow;
//     this.state.currentRow++;
//     this.state.currentIndex = 0;
//     let target_row = this.state.userFill[row_index];

//     for (var i = 0; i < this.state.letterCount; i++) {
//       console.log(target_row[i].letter + "|" + this.state.keyword.charAt(i));
//       if (target_row[i].letter == this.state.keyword.charAt(i)) {
//         this.updateBlock(row_index, i, target_row[i].letter, "correct");
//       } else if (this.state.keyword.includes(target_row[i].letter)) {
//         this.updateBlock(row_index, i, target_row[i].letter, "present");
//       } else {
//         this.updateBlock(row_index, i, target_row[i].letter, "absent");
//       }
//     }
//   }

//   //get the word of one row
//   getFullWordOfRow(row) {
//     let word = "";
//     for (var i = 0; i < this.state.letterCount; i++) {
//       word += this.state.userFill[row][i].letter;
//     }
//     return word;
//   }

//   render() {
//     let blocks = [];
//     for (var i = 0; i < this.state.row_count; i++) {
//       let blocks_row = [];
//       for (var j = 0; j < this.state.letterCount; j++) {
//         blocks_row.push(
//           <Block
//             key={i * this.state.letterCount + j + ""}
//             letter={this.state.userFill[i][j].letter}
//             state={this.state.userFill[i][j].state}
//             isFilled={this.state.userFill[i][j].letter != undefined}
//             isRevealed={this.state.userFill[i][j].state != ""}
//           />
//         );
//       }
//       blocks.push(
//         <div className="row" key={"row" + i}>
//           {blocks_row}
//         </div>
//       );
//     }
//     return (
//       <div id="game-container">
//         <div id="board-container">
//           <div id="board">{blocks}</div>
//         </div>
//         <Keyboard game={this} />
//       </div>
//     );
//   }
// }
