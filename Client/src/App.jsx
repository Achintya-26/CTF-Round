import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import GameRoom from "./pages/Gameroom";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game/:userId/:roomId" element={<GameRoom />} />
        <Route path="/admin/:roomId" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;