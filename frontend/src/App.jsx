import { Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
=======
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import RiskProfile from "./pages/RiskProfile";
>>>>>>> e79bcf01053158de813fdf63e4909ea26756d0d5

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
      <Route path="/home" element={<Home />} />
=======
      <Route path="/risk-profile" element={<RiskProfile />} />

>>>>>>> e79bcf01053158de813fdf63e4909ea26756d0d5
    </Routes>
  );
}

export default App;