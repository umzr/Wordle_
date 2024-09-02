"use client";
import React, { useState } from 'react';
import Game from "@/components/game";
import MultiGame from "@/components/MultiGame";
// import GameRoom from '@/components/GameRoom';

import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper,
  ThemeProvider,
  createTheme
} from '@mui/material';

enum GameMode {
  Menu,
  Single,
  Multi
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function Home() {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.Menu);

  const renderContent = () => {
    switch (gameMode) {
      case GameMode.Single:
        return <Game />;
      case GameMode.Multi:
        return <MultiGame  />;
      default:
        return (
          <Box display="flex" flexDirection="column" gap={2}>
            <Button variant="contained" color="primary" onClick={() => setGameMode(GameMode.Single)}>
              Single Player
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setGameMode(GameMode.Multi)}>
              Multiplayer
            </Button>
          </Box>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          minHeight="100vh" 
          py={4}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Wordle in Next.js
          </Typography>
          
          {gameMode !== GameMode.Menu && (
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => setGameMode(GameMode.Menu)}
              sx={{ mb: 2 }}
            >
              Back to Menu
            </Button>
          )}
          
          <Paper elevation={3} sx={{ p: 3, width: '100%' }}>
            {renderContent()}
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}