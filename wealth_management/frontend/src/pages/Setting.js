import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const navigate = useNavigate();
  const { theme } = useTheme(); 
  const [user, setUser] = useState(null);

  const [view, setView] = useState("profile");
  const [passwords, setPasswords] = useState({
    new_password: "",
    confirm_password: "",
  });

  // Load user from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/");
        return;
      }
      setUser(JSON.parse(storedUser));
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/user/change-password", passwords);
      toast.success("Password updated successfully");
      setPasswords({ new_password: "", confirm_password: "" });
      setView("profile");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    }
  };

  if (!user) {
    return (
      <p className="p-6 text-center text-gray-700 dark:text-gray-300">
        Loading settings...
      </p>
    );
  }

  const cardClass =
    theme === "dark"
      ? "bg-gray-800 text-gray-100 border border-gray-700"
      : "bg-white text-gray-700";

  return (
    <div className="pt-10 flex justify-center px-4 sm:px-6">
      <div className="w-full max-w-lg space-y-8">

        {/* ---------------- Profile Box ---------------- */}
        {view === "profile" && (
          <div className={`${cardClass} p-6 rounded-2xl shadow-xl`}>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-500 dark:text-blue-300">
              Profile Details
            </h2>

            <div className="space-y-3 mb-6">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Risk Profile:</strong> {user.risk_profile || "Moderate"}</p>
              <p>
                <strong>KYC Status:</strong>{" "}
                <span className="text-green-500 font-semibold">
                  {user.kyc_status || "Verified"}
                </span>
              </p>
            </div>

            <button
              onClick={() => setView("password")}
              className="w-full bg-blue-600 dark:bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Change Password
            </button>
          </div>
        )}

        {/* ---------------- Change Password Box ---------------- */}
        {view === "password" && (
          <div className={`${cardClass} p-6 rounded-2xl shadow-xl`}>
            <h2 className="text-2xl font-bold mb-5 text-center text-blue-500 dark:text-blue-300">
              Change Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={passwords.new_password}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 rounded focus:ring-1 focus:outline-none
                    ${
                      theme === "dark"
                        ? "bg-gray-700 border border-gray-600 text-white focus:ring-blue-500"
                        : "bg-blue-50 border border-blue-300 text-gray-900 focus:ring-blue-600"
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={passwords.confirm_password}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 rounded focus:ring-1 focus:outline-none
                    ${
                      theme === "dark"
                        ? "bg-gray-700 border border-gray-600 text-white focus:ring-blue-500"
                        : "bg-blue-50 border border-blue-300 text-gray-900 focus:ring-blue-600"
                    }`}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={() => setView("profile")}
                  className={`flex-1 py-2 rounded-lg transition ${
                    theme === "dark"
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
