import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { signupUser } from "../api/auth";
import { toast } from "react-toastify";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [shake, setShake] = useState({
    name: false,
    email: false,
    password: false,
  });
  const navigate = useNavigate();

  const getStrength = () => {
    if (password.length === 0) return { level: 0, text: "" };
    if (password.length < 8) return { level: 1, text: "Use at least 8 characters" };
    if (!/[A-Z]/.test(password)) return { level: 2, text: "Add an uppercase letter" };
    if (!/[0-9]/.test(password)) return { level: 3, text: "Add a number" };
    if (!/[^A-Za-z0-9]/.test(password)) return { level: 4, text: "Add a special character" };
    return { level: 5, text: "Strong password" };
  };

  const strength = getStrength();
  const isStrongPassword = strength.level === 5;

  const triggerFieldError = (key, message) => {
    setFieldError((prev) => ({ ...prev, [key]: message }));
    setShake((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setShake((prev) => ({ ...prev, [key]: false }));
    }, 400);
  };

  const clearFieldError = (key) => {
    setFieldError((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError({ name: "", email: "", password: "" });

    if (name.trim().length < 2) {
      triggerFieldError("name", "Please enter your full name");
      return;
    }

    if (!email.includes("@")) {
      triggerFieldError("email", "Enter a valid email address");
      return;
    }

    if (!isStrongPassword) {
      triggerFieldError(
        "password",
        strength.text || "Password is not strong enough"
      );
      toast.error("Password is not strong enough");
      return;
    }
    try {
      await signupUser({ name, email, password });
      toast.success("Account created successfully", {
        style: { background: "#ECFDF5", color: "#065F46" },
        progressStyle: { background: "#10B981" },
        autoClose: 1800,
        onClose: () => navigate("/login"),
      });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;
      const detailText = typeof detail === "string" ? detail : "";
      const msg = detailText.toLowerCase().includes("already exists")
        ? "Account already exists. Please sign in."
        : detailText || "Signup failed. Try again.";
      if (msg.startsWith("Account already exists")) {
        triggerFieldError("email", msg);
      }
      toast.error(msg, {
        style: { background: "#FEF2F2", color: "#991B1B" },
        progressStyle: { background: "#EF4444" },
      });
    }
  };

  const strengthColor =
    strength.level < 3 ? "bg-red-600" : strength.level < 5 ? "bg-amber-600" : "bg-emerald-600";

  const hintColor =
    strength.level < 3 ? "text-red-600" : strength.level < 5 ? "text-amber-600" : "text-emerald-600";

  const inputBase =
    "w-full h-[44px] rounded-2xl bg-white border border-transparent " +
    "pl-12 pr-4 text-[16px] text-[#111111] placeholder:text-[#9CA3AF] " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_0_0_1px_rgba(0,0,0,0.18),0_0_0_2px_rgba(255,255,255,1),0_0_0_5px_rgba(255,255,255,0.9),0_0_42px_rgba(255,255,255,1)] " +
    "outline-none focus:border-black/20 focus:ring-4 focus:ring-black/5";
  const inputBasePassword = inputBase.replace("pr-4", "pr-12");
  const inputError = "border border-[#E11D48]/80 ring-4 ring-[#E11D48]/15";

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 -left-28 h-[380px] w-[380px] rounded-full bg-white/35 blur-[120px]" />
      <div className="pointer-events-none absolute -top-28 -right-28 h-[380px] w-[380px] rounded-full bg-white/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[460px] w-[460px] rounded-full bg-white/30 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[460px] w-[460px] rounded-full bg-white/35 blur-[140px]" />

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div
          className="w-full max-w-[760px] rounded-[26px] border border-white/60 bg-white/40
                     backdrop-blur-2xl shadow-[0_14px_30px_rgba(0,0,0,0.12),0_40px_110px_rgba(0,0,0,0.25)]
                     overflow-hidden"
        >
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gradient-to-b from-white to-[#F5F5F5] p-6 sm:p-7">
              <h1 className="text-[36px] leading-tight font-semibold text-[#111827] tracking-tight">
                Sign up
              </h1>

              <div className="mt-6">
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[14px] font-medium text-[#111111]">
                      Full name
                    </label>
                    <div className={`relative ${shake.name ? "shake-x" : ""}`}>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/45">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <path
                            d="M4.5 20a7.5 7.5 0 0 1 15 0"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>

                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearFieldError("name");
                        }}
                        className={`${inputBase} ${fieldError.name ? inputError : ""}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-medium text-[#111111]">
                      Email address
                    </label>
                    <div className={`relative ${shake.email ? "shake-x" : ""}`}>
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearFieldError("email");
                        }}
                        className={`${inputBase} ${fieldError.email ? inputError : ""}`}
                        required
                      />
                    </div>
                    {fieldError.email && (
                      <p className="mt-2 text-[14px] text-red-600">
                        {fieldError.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[14px] font-medium text-[#111111]">
                      Password
                    </label>

                    <div className={`relative ${shake.password ? "shake-x" : ""}`}>
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearFieldError("password");
                        }}
                        className={`${inputBasePassword} ${
                          fieldError.password ? inputError : ""
                        } ${strength.level === 5 ? "focus:bg-white focus:border-transparent focus:ring-0" : ""}`}
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

                    {password && (
                      <div className="pt-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${
                                strength.level >= i ? strengthColor : "bg-black/10"
                              }`}
                            />
                          ))}
                        </div>
                        <div className={`mt-1.5 text-[14px] ${hintColor}`}>
                          {strength.text}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isStrongPassword}
                    className={`w-full h-[46px] rounded-2xl text-[17px] font-semibold transition hover:-translate-y-[1px] active:translate-y-0
                      ${
                        isStrongPassword
                          ? "bg-[#0B0B0F] text-white hover:bg-black shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                          : "bg-black/15 text-black/40 cursor-not-allowed"
                      }`}
                  >
                    Create account
                  </button>

                  <div className="pt-2 text-center">
                    <div className="text-[15px] text-[#9CA3AF]">
                      Already have an account?{" "}
                      <Link to="/login" className="text-black font-semibold underline underline-offset-4">
                        Sign in
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="md:w-1/2 bg-gradient-to-b from-[#000000] to-[#1C1C1C] text-white relative p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/14 to-transparent" />

              <div className="relative w-full">
                <div className="inline-flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <span className="font-extrabold tracking-wide text-[16px]">WM</span>
                  </div>
                  <div className="text-white/80 text-sm font-semibold tracking-wide">
                    Wealth Management
                  </div>
                </div>

                <h2 className="mt-10 text-[28px] leading-tight font-semibold">
                  Start building your wealth
                </h2>

                <p className="mt-4 text-white/70 text-[13px] leading-relaxed">
                  Create an account to track goals, understand your risk profile,
                  and grow your financial plan with a secure and modern dashboard.
                </p>

                <div className="mt-8 rounded-[20px] border border-white/10 bg-[#3A3A3A] p-5">
                  <div className="text-white text-[16px] font-semibold">
                    Your goals. Your progress.
                  </div>
                  <div className="mt-2 text-white/70 text-[12px] leading-relaxed">
                    Keep everything organized — savings, milestones, and insights — in one place.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
