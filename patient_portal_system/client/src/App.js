import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import "./App.css";
import axios from "axios";

const PORT = 8080;

function App() {
  const apiCall = () => {
    axios.get(`http://localhost:${PORT}`).then((data) => {
      console.log(data.data);
    });
  };

  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage apiCall={apiCall} />} />
        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
