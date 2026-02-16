import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await api.post("/user/register", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      toast.success("Registration successful 🎉 Please login");
      navigate("/");
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error("Registration failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {/* App Title */}
        <div className="text-center mb-3">
          <h1 className="text-3xl font-bold text-blue-700">
            Wealth Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Securely manage your financial goals
          </p>
        </div>

        {/* Register Title */}
        <h2 className="text-2xl font-semibold text-center text-blue-800 mb-3">
          Register
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-blue-300 bg-blue-50 p-2 rounded-lg
                         focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-blue-300 bg-blue-50 p-2 rounded-lg
                         focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-blue-300 bg-blue-50 p-2 rounded-lg
                         focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-blue-700 text-white py-2 rounded-lg
                       hover:bg-blue-600 transition font-medium shadow"
          >
            Register
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
