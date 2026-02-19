import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";

/* ===== API ===== */
import { getCurrentUser } from "./api/auth";

/* ===== Components ===== */
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import RiskAssessment from "./components/RiskAssessment";
import SetGoal from "./components/SetGoal";
import Portfolio from "./components/portfolio";
import Profile from "./components/profile";
import MarketDashboard from "./components/MarketDashboard";
import Recommendations from "./components/Recommendations";

/* ===== Pages ===== */
import SimulationForm from "./pages/SimulationForm";
import SimulationResult from "./pages/SimulationResult";

/* =========================
   PROTECTED ROUTE
========================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();

        // 🚨 Force risk assessment for new users
        if (!user.profile_completed) {
          window.location.href = "/risk-assessment";
          return;
        }

        setAllowed(true);
      } catch (err) {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  if (loading) return null; // you can add loader later
  return allowed ? children : null;
}

function App() {
  const [theme, setTheme] = useState("light");

  // 🌗 Detect system theme + stored preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);

    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div
      className="
        min-h-screen
        transition-colors duration-300
        bg-transparent
        text-gray-900
        dark:bg-gray-900
        dark:text-gray-100
      "
    >
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Risk Assessment (ALWAYS accessible) */}
        <Route path="/risk-assessment" element={<RiskAssessment />} />

        {/* Core App (PROTECTED) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/set-goal"
          element={
            <ProtectedRoute>
              <SetGoal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <MarketDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <Recommendations />
            </ProtectedRoute>
          }
        />

        {/* Simulations */}
        <Route
          path="/simulation"
          element={
            <ProtectedRoute>
              <SimulationForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/simulation/result"
          element={
            <ProtectedRoute>
              <SimulationResult />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
