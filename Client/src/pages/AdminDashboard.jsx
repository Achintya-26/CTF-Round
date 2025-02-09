import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://192.168.1.3:5000");

const AdminDashboard = () => {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // Fetch initial player data
    const fetchProgress = async () => {
      const response = await fetch(`http://192.168.1.3:5000/admin/progress/${roomId}`);
      const data = await response.json();
      setPlayers(data);
    };

    fetchProgress();

    // Listen for real-time progress updates
    socket.emit("joinRoom", roomId);

    socket.on("progressUpdate", (data) => {
      console.log("Received progress update:", data);

      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player._id === data.userId ? { ...player, progress: data.checkpoint } : player
        )
      );
    });

    return () => {
      socket.off("progressUpdate");
    };
  }, [roomId]);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <ul>
        {players.map((player) => (
          <li key={player._id}>
            {player.username}: {player.progress}/10
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;
