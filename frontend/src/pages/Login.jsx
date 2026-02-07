import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const res = await axios.post("http://127.0.0.1:8000/api/v1/auth/login", params);
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
      localStorage.setItem("kyc_status", res.data.kyc_status);
      localStorage.setItem("profile_completed", res.data.profile_completed);

      toast.success(`Welcome back, ${res.data.name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative font-sans text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)]"></div>

      <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="glass-card p-10 border-white/10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50"></div>

          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight">WealthTracker</h1>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Username</label>
              <input
                type="text"
                required
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all focus:bg-white/[0.08]"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all focus:bg-white/[0.08]"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-[1.25rem] text-sm font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl shadow-blue-600/30 mt-4 active:scale-[0.98]">
              Sign In
            </button>
          </form>

          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} className="text-blue-500 hover:text-blue-400 underline decoration-2 underline-offset-4 transition-colors">Register here</button>
          </p>
        </div>
      </div>
    </div>
  );
}
