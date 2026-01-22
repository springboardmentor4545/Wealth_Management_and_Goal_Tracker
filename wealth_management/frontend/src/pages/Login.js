import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      const res = await api.post("/user/login", {
        email: email.trim(),
        password: password.trim(),
      });

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login successful");

      if (res.data.user.profile_completed) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className=" flex items-center justify-center min-h-[calc(100vh-64px)]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] w-96"
      >
        {/* -------- App Title -------- */}
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-1">
          Wealth Management
        </h1>
        <p className="text-center text-gray-500 text-sm mb-4">
          Securely manage your financial goals
        </p>

        <h2 className="text-xl font-bold mb-4 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-blue-300 p-2 mb-3 w-full rounded
                     focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none bg-blue-50"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-blue-300 p-2 mb-3 w-full rounded
                     focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none bg-blue-50"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>

        <p className="mt-3 text-center text-sm">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
