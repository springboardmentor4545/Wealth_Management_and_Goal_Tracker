import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { loginUser } from "../api/auth";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await loginUser({ email, password, remember: false });
      toast.success("Login successful", {
        style: { background: "#ECFDF5", color: "#065F46" },
        progressStyle: { background: "#10B981" },
        autoClose: 1200,
        onClose: () => navigate("/home"),
      });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed. Try again.", {
        style: { background: "#FEF2F2", color: "#991B1B" },
        progressStyle: { background: "#EF4444" },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-black/5 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-black/5 blur-[90px]" />

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-[760px] rounded-[26px] border border-white/60 bg-white/40
                     backdrop-blur-2xl shadow-[0_14px_30px_rgba(0,0,0,0.12),0_40px_110px_rgba(0,0,0,0.25)]
                     overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-b from-white to-[#F5F5F5] p-6 sm:p-7">
              <h1 className="text-[36px] leading-tight font-semibold text-[#111111] tracking-tight">
                Login
              </h1>
              <p className="mt-1 text-[14px] text-[#9CA3AF]">
                Please sign in to continue.
              </p>

              <div className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-medium text-[#111111]">
                      Email address
                    </label>
                    <div className="relative flex flex-col items-center text-center">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/45">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M4 6h16v12H4V6Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                          <path
                            d="m4 7 8 6 8-6"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full h-[44px] rounded-2xl bg-white border border-transparent
                                   pl-12 pr-4 text-[16px] text-[#111111] placeholder:text-[#9CA3AF]
                                   shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_0_0_1px_rgba(0,0,0,0.18),0_0_0_2px_rgba(255,255,255,1),0_0_0_5px_rgba(255,255,255,0.9),0_0_42px_rgba(255,255,255,1)]
                                   outline-none focus:border-black/20 focus:ring-4 focus:ring-black/5"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-medium text-[#111111]">
                      Password
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/45">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M7 11V8a5 5 0 0 1 10 0v3"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-5A2.5 2.5 0 0 1 6.5 11Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full h-[44px] rounded-2xl bg-white border border-transparent
                                   pl-12 pr-12 text-[16px] text-[#111111] placeholder:text-[#9CA3AF]
                                   shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_0_0_1px_rgba(0,0,0,0.18),0_0_0_2px_rgba(255,255,255,1),0_0_0_5px_rgba(255,255,255,0.9),0_0_42px_rgba(255,255,255,1)]
                                   outline-none focus:border-black/20 focus:ring-4 focus:ring-black/5"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/60 hover:text-black/80 transition"
                        aria-label="Toggle password"
                      >
                        {showPassword ? (
                          <Eye size={20} strokeWidth={1.8} />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m15 18-.722-3.25" />
                            <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                            <path d="m20 15-1.726-2.05" />
                            <path d="m4 15 1.726-2.05" />
                            <path d="m9 18 .722-3.25" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                  className="w-full h-[46px] rounded-2xl bg-[#FBBF24] text-white text-[17px] font-semibold transition hover:-translate-y-[1px] active:translate-y-0
                               hover:bg-[#F5B60A] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                  >
                    Login
                  </button>

                  <div className="pt-2 text-center">
                    <div className="text-[15px] text-[#9CA3AF]">
                      Don&apos;t have an account?{" "}
                      <Link to="/signup" className="text-black font-semibold underline underline-offset-4">
                        Sign up
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:w-1/2 bg-gradient-to-b from-[#000000] to-[#1C1C1C] text-white relative p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />

              <div className="relative flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <span className="font-extrabold tracking-wide text-[16px]">WM</span>
                  </div>
                  <div className="text-white/80 text-sm font-semibold tracking-wide">
                    Wealth Management
                  </div>
                </div>

                <h2 className="mt-10 text-[34px] leading-tight font-semibold">
                  Welcome to Wealth Management
                </h2>

                <p className="mt-4 text-white/70 text-[14px] font-semibold leading-relaxed max-w-[420px] text-center">
                  Plan . Track . Grow
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
