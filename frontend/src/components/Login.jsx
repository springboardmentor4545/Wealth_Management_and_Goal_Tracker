import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Load remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // 🔒 prevents double login
    setLoading(true);

    try {
      const res = await loginUser({ email, password });

      if (res) {
        // Remember me logic
        if (rememberMe) {
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
        }

        toast.success("Login successful 🎉");

        setTimeout(() => {
          navigate("/home");
        }, 1000);
      }
    } catch (error) {
      toast.error("Invalid email or password ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="backdrop-blur-md bg-white/80 rounded-3xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-4xl font-heading font-bold text-center mb-2 text-orange-800">
          WealthIQ
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Smart wealth. Smarter decisions.
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-orange-400"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password with eye toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 cursor-pointer text-gray-600 select-none"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-orange-600"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700
                       text-white rounded-full font-semibold transition duration-200
                       disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-700">
          New to WealthIQ?{" "}
          <Link
            to="/signup"
            className="text-orange-700 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
