import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("https://ctf-round.onrender.com", { transports: ["websocket"] });

const GameRoom = () => {
  const { userId, roomId } = useParams();
  const [progress, setProgress] = useState(() => {
    return localStorage.getItem("progress") ? Number(localStorage.getItem("progress")) : 0;
  });

  useEffect(() => {
    // Fetch current progress from DB on first load or reload
    const fetchProgress = async () => {
      try {
        const response = await fetch(`https://ctf-round.onrender.com/player/progress/${userId}`);
        const data = await response.json();
        setProgress(data.progress);
        localStorage.setItem("progress", data.progress); // Store in localStorage
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
    socket.emit("joinRoom", roomId);

    return () => {
      socket.off("progressUpdate");
    };
  }, [roomId, userId]);

  const handleCheckpoint = async () => {
    if (progress < 10) {
      const newProgress = progress + 1;
      setProgress(newProgress);
      localStorage.setItem("progress", newProgress);

      await fetch("https://ctf-round.onrender.com/update-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, checkpoint: newProgress }),
      });

      socket.emit("progressUpdate", { userId, checkpoint: newProgress });
    }
  };

  return (
    <div>
      <h2>Game Room</h2>
      <p>Checkpoint: {progress}/10</p>
      <button onClick={handleCheckpoint} disabled={progress >= 10}>Next Checkpoint</button>
    </div>
  );
};

export default GameRoom;
