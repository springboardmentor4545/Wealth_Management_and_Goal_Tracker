import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await api.post("/user/register", {
        name,
        email,
        password,
      });

      toast.success("Registration successful 🎉 Please login");

      navigate("/");
    } catch (err) {
      toast.error("Registration failed ❌");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] w-96 "
      >
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-1">
          Wealth Management
        </h1>
        <p className="text-center text-gray-500 text-sm mb-4">
          Securely manage your financial goals
        </p>
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

        <input
          type="text"
          placeholder="Name"
          className="w-full border  border-blue-300 p-2 mb-3 bg-blue-50 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full border  border-blue-300 p-2 mb-3 bg-blue-50 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border  border-blue-300 p-2 mb-3 bg-blue-50 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
