import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import RiskAssessment from "./components/RiskAssessment";
import Goals from "./components/Goals";
import Portfolio from "./components/Portfolio";
import SimulationsPage from './components/SimulationsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/risk-assessment" element={<RiskAssessment />} />
      <Route path="/goals" element={<Goals />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/simulations" element={<SimulationsPage />} />
    </Routes>
  );
}

export default App;