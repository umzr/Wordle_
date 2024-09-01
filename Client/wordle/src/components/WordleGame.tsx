'use client';

import React, { useState, useCallback } from 'react';
import { Typography, Box, Button } from '@mui/material';
import Grid from './Grid';
import Keyboard from './Keyboard';
import { answers, allowedGuesses } from '../utils/words';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

const WordleGame: React.FC = () => {
  const [answer] = useState(() => answers[Math.floor(Math.random() * answers.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);

  const onChar = useCallback((value: string) => {
    if (currentGuess.length < WORD_LENGTH && guesses.length < MAX_GUESSES && !gameOver) {
      setCurrentGuess((prev) => prev + value);
    }
  }, [currentGuess, guesses, gameOver]);

  const onDelete = useCallback(() => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, []);

  const onEnter = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) return;
    if (!(answers.includes(currentGuess) || allowedGuesses.includes(currentGuess))) return;

    setGuesses((prev) => [...prev, currentGuess]);
    setCurrentGuess('');

    if (currentGuess === answer || guesses.length + 1 === MAX_GUESSES) {
      setGameOver(true);
    }
  }, [currentGuess, answer, guesses]);

  const restart = () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    // Optionally, you can reset the answer here if you want a new word each game
    // setAnswer(answers[Math.floor(Math.random() * answers.length)]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Grid guesses={guesses} currentGuess={currentGuess} answer={answer} />
      <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} />
      {gameOver && (
        <Box>
          <Typography variant="h6">
            {guesses[guesses.length - 1] === answer ? 'You won!' : 'Game Over'}
          </Typography>
          <Typography>The word was: {answer}</Typography>
          <Button onClick={restart} variant="contained" sx={{ mt: 2 }}>
            Play Again
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WordleGame;