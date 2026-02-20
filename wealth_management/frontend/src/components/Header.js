import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUser } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const showBack = user && location.pathname !== "/dashboard";

  const textColor = theme === "dark" ? "text-blue-300" : "text-blue-700";
  const hoverTextColor =
    theme === "dark" ? "hover:text-blue-100" : "hover:text-blue-500";

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/goals", label: "Goals" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/market", label: "Market" },
    { path: "/simulations", label: "Simulations" },
    { path: "/recommendations", label: "Recommendations" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full shadow-md z-50 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-6">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className={`font-medium ${textColor} ${hoverTextColor}`}
            >
              ← Back
            </button>
          )}

          <h1
            onClick={() => navigate("/dashboard")}
            className={`text-2xl font-bold cursor-pointer ${textColor}`}
          >
            Wealth Management
          </h1>

        </div>

        {/* RIGHT SECTION */}
        {user && (
          <div className="flex items-center gap-6">

            {/* NAVIGATION */}
            <nav className="hidden md:flex gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-medium ${textColor} ${hoverTextColor}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

           

            {/* USER DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 ${textColor}`}
              >
                <FiUser />
                <span className="hidden md:block">{user.email}</span>
              </button>

              {open && (
                <div
                  className={`absolute right-0 mt-3 w-48 rounded-xl shadow-lg border ${
                    theme === "dark"
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => {
                      toggleTheme();
                      setOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left ${
                      theme === "dark"
                        ? "text-blue-300 hover:bg-gray-700"
                        : "text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    {theme === "dark" ? "☀ Light Theme" : "🌙 Dark Theme"}
                  </button>

                  <Link
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 ${
                      theme === "dark"
                        ? "text-blue-300 hover:bg-gray-700"
                        : "text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 ${
                      theme === "dark"
                        ? "text-red-500 hover:bg-gray-700"
                        : "text-red-600 hover:bg-red-100"
                    }`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </header>
  );
}
