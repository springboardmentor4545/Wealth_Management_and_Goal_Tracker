import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import HomeWelcome from "./components/HomeWelcome";
import RiskAssessment from "./components/RiskAssessment";
import Layout from "./components/Layout";
import Goals from "./components/Goals";
import Profile from "./components/Profile";

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable={false}
        theme="light"
      />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<HomeWelcome />} />
        <Route path="/risk-assessment" element={<RiskAssessment />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
