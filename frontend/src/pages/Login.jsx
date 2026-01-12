import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/login",
        new URLSearchParams({
          username,
          password,
        })
      );

      // Store token
      localStorage.setItem("access_token", res.data.access_token);

      console.log("JWT:", res.data.access_token);
      console.log("Profile completed:", res.data.profile_completed);

      // Redirect
      if (res.data.profile_completed) {
        navigate("/dashboard");
      } else {
        navigate("/kyc");
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-gray-800 p-6 rounded w-80">
        <h2 className="text-xl mb-4 text-white">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="bg-blue-600 w-full py-2 rounded text-white">
          Login
        </button>

        <p className="mt-4 text-center text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-400">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
