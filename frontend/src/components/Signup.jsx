import { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../api/auth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState("");

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

    const res = await signupUser({ name, email, password });
    if (res) {
      setSuccess("✅ Signup successful");
      setName("");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Create Account ✨
        </h2>

        {success && (
          <p className="text-green-600 text-center mb-4 font-semibold">
            {success}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            className="w-full px-4 py-2 border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            className="w-full px-4 py-2 border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password field with eye toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              className="w-full px-4 py-2 border rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 cursor-pointer text-gray-600"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Password rules */}
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

          <button
            type="submit"
            disabled={!isStrongPassword}
            className={`w-full py-2 rounded-lg font-semibold transition
              ${
                isStrongPassword
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-400 text-gray-700 cursor-not-allowed"
              }`}
          >
            Signup
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-600 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
