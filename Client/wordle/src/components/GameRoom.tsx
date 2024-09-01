"use client";

import React, { useEffect, useState } from "react";
import MultiGame from "./MultiGame"; // Ensure the correct path
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import { CircularProgress } from "@mui/material"; // For loading spinner
import Server from "./Mserver"; // Ensure the correct path for your Server module

const GameRoom: React.FC = () => {
  const router = useRouter(); // Use useRouter from Next.js
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<{ keyword: string } | null>(null);

  useEffect(() => {
    // Initialize connection and wait for room data
    Server.waitRoom({ userid: "player1" }, (data) => {
      setGameData({ keyword: data.word });
      setLoading(false);
    });
  }, []);

  const handleGameResult = (playerResult: string, opponentResult: string) => {
    console.log("Player Result:", playerResult);
    console.log("Opponent Result:", opponentResult);
  };

  const handleGameStateChange = (state: number) => {
    console.log("Game state updated:", state);
  };

  if (loading) {
    return (
      <div className="loading">
        Preparing Room...
        <CircularProgress />
      </div>
    );
  }

  if (!gameData) {
    return (
      <div>
        <p>Error: Unable to load game data. Please try again.</p>
      </div>
    );
  }

  return (
    <MultiGame
      keyword={gameData.keyword}
      resultdef={handleGameResult}
      gamestatedef={handleGameStateChange}
    />
  );
};

export default GameRoom;
