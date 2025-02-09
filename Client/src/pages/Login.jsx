import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const deviceId = navigator.userAgent; // Simple device identifier
    const response = await fetch("https://ctf-round.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, deviceId }),
    });

    const data = await response.json();
    if (response.ok) {
      navigate(`/game/${data.userId}/${data.roomId}`);
    } else {
      alert(data.message);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleLogin}>Join Game</button>
    </div>
  );
};

export default Login;
