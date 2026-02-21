import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem("name") || "User");
  const [email, setEmail] = useState(localStorage.getItem("email") || "Not provided");
  const [kycStatus, setKycStatus] = useState(localStorage.getItem("kyc_status") || "unverified");
  const [profileCompleted, setProfileCompleted] = useState(localStorage.getItem("profile_completed") === "true");
  const [riskScore, setRiskScore] = useState(localStorage.getItem("risk_score") || "");
  const [riskProfile, setRiskProfile] = useState(localStorage.getItem("risk_profile") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("http://127.0.0.1:8000/api/v1/auth/profile/status", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { kyc_status, profile_completed, risk_score, risk_profile } = res.data;
      setKycStatus(kyc_status);
      setProfileCompleted(profile_completed);
      setRiskScore(risk_score);
      setRiskProfile(risk_profile);

      localStorage.setItem("kyc_status", kyc_status);
      localStorage.setItem("profile_completed", profile_completed);
      localStorage.setItem("risk_score", risk_score || "");
      localStorage.setItem("risk_profile", risk_profile || "");
    } catch (err) {
      toast.error("Failed to sync profile status");
      console.error("Failed to fetch profile status", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>

      <div className="relative max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
        <Navbar />

        <header className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">My Account</h2>
            <h1 className="text-5xl font-black tracking-tight">User Profile</h1>
            <p className="text-slate-400 font-medium">Manage your identity and account status.</p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Identity Card */}
          <div className="lg:col-span-2 glass-card p-10 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent flex flex-col items-center text-center space-y-8 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>

            <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl shadow-blue-600/30 transform group-hover:scale-105 transition-transform duration-500 relative z-10 border border-blue-500/20">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="text-3xl font-black tracking-tight uppercase text-white">{name}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{email}</p>
            </div>

            <div className="pt-6 w-full border-t border-white/5 space-y-4 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Joined Date</span>
                <span className="text-slate-300">FEB 2026</span>
              </div>
            </div>
          </div>

          {/* Verification Node */}
          <div className="lg:col-span-3 space-y-8">
            <div className="glass-card p-10 border-white/10 space-y-8 relative overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-6">Account Status</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3 hover:bg-white/[0.08] transition-colors cursor-default group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">KYC Status</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${kycStatus === "verified" ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <span className={`text-sm font-black uppercase tracking-widest ${kycStatus === "verified" ? "text-emerald-500" : "text-amber-500"}`}>
                      {kycStatus === "verified" ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3 hover:bg-white/[0.08] transition-colors cursor-default group">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-400">Assessment</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${profileCompleted ? "bg-emerald-500" : "bg-blue-500"}`}></div>
                    <span className={`text-sm font-black uppercase tracking-widest ${profileCompleted ? "text-emerald-500" : "text-blue-500"}`}>
                      {profileCompleted
                        ? (riskProfile ? `${riskProfile}` : "Completed")
                        : "Action Required"}
                    </span>
                  </div>
                </div>
              </div>

              {kycStatus !== "verified" && (
                <div className="p-8 bg-blue-600/5 rounded-3xl border border-blue-600/20 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-widest text-blue-400">Identity Needed</h4>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">Some features are restricted. Please verify your account to gain full access.</p>
                  </div>
                  <button
                    onClick={() => navigate("/kyc")}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.3em] py-4 rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                  >
                    Complete KYC
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
