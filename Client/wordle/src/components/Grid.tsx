import React from 'react';
import { Box } from '@mui/material';

interface GridProps {
  guesses: string[];
  currentGuess: string;
  answer: string;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const Grid: React.FC<GridProps> = ({ guesses, currentGuess, answer }) => {
  const empties = MAX_GUESSES - guesses.length - 1;

  return (
    <Box sx={{ display: 'grid', gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)`, gap: 1 }}>
      {guesses.map((guess, i) => (
        <Row key={i} guess={guess} answer={answer} />
      ))}
      {guesses.length < MAX_GUESSES && <Row guess={currentGuess} answer={answer} current />}
      {empties > 0 && [...Array(empties)].map((_, i) => <Row key={i} guess="" answer={answer} />)}
    </Box>
  );
};

interface RowProps {
  guess: string;
  answer: string;
  current?: boolean;
}

const Row: React.FC<RowProps> = ({ guess, answer, current = false }) => {
  const tiles = [];

  for (let i = 0; i < WORD_LENGTH; i++) {
    const char = guess[i];
    let state = 'empty';

    if (char) {
      if (char === answer[i]) {
        state = 'correct';
      } else if (answer.includes(char)) {
        state = 'present';
      } else {
        state = 'absent';
      }
    }

    tiles.push(
      <Box
        key={i}
        sx={{
          width: 50,
          height: 50,
          border: '2px solid',
          borderColor: char ? 'grey.500' : 'grey.300',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          backgroundColor: current ? 'background.paper' :
            state === 'correct' ? 'success.light' :
            state === 'present' ? 'warning.light' :
            state === 'absent' ? 'grey.300' : 'background.paper',
        }}
      >
        {char}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {tiles}
    </Box>
  );
};

export default Grid;