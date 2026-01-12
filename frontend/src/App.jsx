import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Kyc from "./pages/kyc";
import ProtectedRoute from "./components/ProtectedRoute";
import RiskProfile from "./pages/riskprofile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/kyc" element={<Kyc />} />
        <Route path="/risk-profile" element={<ProtectedRoute><RiskProfile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
