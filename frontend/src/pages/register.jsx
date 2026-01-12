import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const data = await registerUser({ email, password });
      setSuccess("✅ Registration successful! Redirecting to login...");
      setEmail("");
      setPassword("");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      
      // Better error message handling
const errorMessage = (() => {
        try {
          // Try to extract error message from various API response formats
          const data = err.response?.data;
          if (!data) return "Registration failed. Please try again.";
          
          // Handle string message
          if (typeof data === 'string') return data;
          
          // Handle common error response formats
          if (data.detail) return String(data.detail);
          if (data.message) return String(data.message);
          if (data.errors && Array.isArray(data.errors)) {
            return data.errors.map(e => typeof e === 'string' ? e : e.msg || String(e)).join(', ');
          }
          if (data.error) return String(data.error);
          
          // Fallback to error message or default
          return err.message || "Registration failed. Please try again.";
        } catch (e) {
          return "Registration failed. Please try again.";
        }
      })();
      
      setError("❌ " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleRegister} className="bg-gray-800 p-6 rounded-lg w-80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Register</h2>

        {/* Success Message */}
        {success && (
          <p className="bg-green-500 text-white p-2 rounded mb-3 text-center font-semibold">
            {success}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="bg-red-500 text-white p-2 rounded mb-3 text-center font-semibold">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 rounded border border-gray-600 bg-gray-700 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          className="w-full mb-3 p-2 rounded border border-gray-600 bg-gray-700 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <button 
          type="submit" 
          className={`w-full py-2 rounded font-semibold transition ${
            loading 
              ? "bg-gray-600 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="mt-4 text-center text-gray-300">
          Already have account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
