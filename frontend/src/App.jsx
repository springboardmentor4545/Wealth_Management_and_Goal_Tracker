import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import RiskAssessment from "./components/RiskAssessment";
import SetGoal from "./components/SetGoal";
import Portfolio from "./components/portfolio";
import Profile from "./components/profile";
import MarketDashboard from "./components/MarketDashboard"; // ✅ ADD THIS

function App() {
  return (
    <>
      {/* ✅ Toast container */}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="min-h-screen bg-gradient-to-br from-[#f5c16c] via-[#f0a04b] to-[#c2410c]">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/risk-assessment" element={<RiskAssessment />} />
          <Route path="/set-goal" element={<SetGoal />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* ✅ MARKET DASHBOARD ROUTE */}
          <Route path="/market" element={<MarketDashboard />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
