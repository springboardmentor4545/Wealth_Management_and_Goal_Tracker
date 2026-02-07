import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Password Complexity Validation
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol.");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("name", name);
      params.append("email", email);
      params.append("password", password);

      await axios.post("http://127.0.0.1:8000/api/v1/auth/register", params);
      toast.success("Account created successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error("Registration failed. Email might already be in use.");
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
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">Create your new account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all focus:bg-white/[0.08]"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all focus:bg-white/[0.08]"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Create Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all focus:bg-white/[0.08]"
                  placeholder="At least 6 characters"
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
              Register Account
            </button>
          </form>

          <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-blue-500 hover:text-blue-400 underline decoration-2 underline-offset-4 transition-colors">Sign In here</button>
          </p>
        </div>
      </div>
    </div>
  );
}
