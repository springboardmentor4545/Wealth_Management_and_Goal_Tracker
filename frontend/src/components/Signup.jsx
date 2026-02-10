import { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../api/auth";
import { toast } from "react-toastify";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Password rules
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasLength = password.length >= 8;

  const isStrongPassword =
    hasUpper && hasLower && hasNumber && hasSpecial && hasLength;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword) return;

    try {
      const res = await signupUser({ name, email, password });
      if (res) {
        toast.success("Signup successful 🎉");
        setName("");
        setEmail("");
        setPassword("");
        setShowRules(false);
      }
    } catch (err) {
      // Improved catch block: show exact backend error
      console.error("Signup error:", err); // log full error in console
      const message =
        err?.response?.data?.detail || // FastAPI usually sends errors in "detail"
        err?.response?.data?.message ||
        err?.message ||
        "Signup failed";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400">
      <div className="backdrop-blur-md bg-white/80 rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-4xl font-heading font-bold text-center text-orange-800 mb-2">
          WealthIQ
        </h2>
        <p className="text-center text-gray-700 mb-8">
          Build wealth with clarity and confidence
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowRules(true)}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 cursor-pointer text-gray-600 select-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Password rules */}
          {showRules && (
            <div className="text-sm space-y-1">
              <p className={hasLength ? "text-green-600" : "text-red-500"}>
                • At least 8 characters
              </p>
              <p className={hasUpper ? "text-green-600" : "text-red-500"}>
                • One uppercase letter
              </p>
              <p className={hasLower ? "text-green-600" : "text-red-500"}>
                • One lowercase letter
              </p>
              <p className={hasNumber ? "text-green-600" : "text-red-500"}>
                • One number
              </p>
              <p className={hasSpecial ? "text-green-600" : "text-red-500"}>
                • One special character
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isStrongPassword}
            className={`w-full py-3 rounded-full font-semibold transition duration-200
              ${
                isStrongPassword
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-700">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-orange-700 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
