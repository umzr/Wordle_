"use client";

import React, { useEffect, useState } from "react";
import MultiGame from "./MultiGame"; // Ensure the correct path
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import { CircularProgress } from "@mui/material"; // For loading spinner
import Server from "./Mserver"; // Ensure the correct path for your Server module

const GameRoom: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<{ keyword: string; roomName: string; playerName: string } | null>(null);

  useEffect(() => {
    Server.connect(); // Connect to the server

    Server.waitRoom({ userid: "random-user" }, (data) => {
      setGameData({ keyword: data.word, roomName: data.roomName, playerName: data.playerName });
      setLoading(false);
    });

    Server.socket.on('roomDetails', (data) => {
      setGameData(data);
      setLoading(false);
    });

    return () => {
      Server.disconnect();
    };
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
  console.log(gameData.keyword, 'gameData.keyword');

  return (
    <div>[{gameData.keyword}]</div>
    //   <MultiGame
    //     keyword={gameData.keyword}
    //     resultdef={handleGameResult}
    //     gamestatedef={handleGameStateChange}
    //   />
  );
};

export default GameRoom;
