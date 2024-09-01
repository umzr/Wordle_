"use client";

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Import the UUID function
import MultiGame from "./MultiGame"; // Ensure the correct path
import { useRouter } from "next/navigation"; // Import useRouter from Next.js
import { CircularProgress } from "@mui/material"; // For loading spinner
import Server from "./Mserver"; // Ensure the correct path for your Server module

const GameRoom: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState<{
    keyword: string;
    roomName?: string;
    playerName?: string;
  } | null>(null);

  // Use useState to manage userId and initialize it from local storage or generate a new one
  const [userId] = useState(() => {
    // Check if there's a saved userId in local storage
    const storedId = localStorage.getItem("userId");
    if (storedId) {
      return storedId; // Return the existing ID if found
    } else {
      const newId = uuidv4(); // Generate a new UUID if not found
      localStorage.setItem("userId", newId); // Save the new ID to local storage
      return newId;
    }
  });

  useEffect(() => {
    Server.connect(); // Connect to the server

    Server.waitRoom({ userid: userId }, (data) => {
      setGameData({
        keyword: data.word,
        roomName: data.roomName || "",
        playerName: data.playerName || "",
      });
      setLoading(false);
    });

    Server.socket.on("roomDetails", (data) => {
      setGameData((prevData) => ({
        ...prevData,
        roomName: data.roomName,
        playerName: data.playerName,
      }));
      setLoading(false);
    });

    return () => {
      Server.disconnect();
    };
  }, [userId]); // Remove userId as a dependency to the useEffect

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
    <div>
      {/* Debug Information */}
      <div
        style={{
          border: "1px solid red",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <h3>Debug Info:</h3>
        <p>
          <strong>Loading:</strong> {loading.toString()}
        </p>
        <p>
          <strong>Game Data:</strong> {JSON.stringify(gameData, null, 2)}
        </p>
        <p>
          <strong>User ID:</strong> {userId}
        </p>
      </div>

      {/* Original MultiGame Component */}
      {/* <MultiGame
        keyword={gameData?.keyword || "N/A"} // Provide a fallback value if gameData or keyword is undefined
        resultdef={handleGameResult}
        gamestatedef={handleGameStateChange}
      /> */}
    </div>
  );
};

export default GameRoom;
