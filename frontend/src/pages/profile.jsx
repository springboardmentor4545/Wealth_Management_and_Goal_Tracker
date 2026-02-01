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

      const { kyc_status, profile_completed } = res.data;
      setKycStatus(kyc_status);
      setProfileCompleted(profile_completed);

      localStorage.setItem("kyc_status", kyc_status);
      localStorage.setItem("profile_completed", profile_completed);
    } catch (err) {
      toast.error("Failed to sync profile status");
      console.error("Failed to fetch profile status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 relative font-sans text-white">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

      <div className="relative max-w-3xl mx-auto space-y-6">
        <Navbar />

        {/* Minimal Profile Card */}
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-8">
          <div className="flex items-center gap-6 pb-6 border-b border-white/10">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              <p className="text-slate-400">{email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold">Account Verification</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                <span className="text-slate-300 text-sm">KYC Status</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${kycStatus === "verified" ? "text-green-400" : "text-yellow-400"}`}>
                  {kycStatus === "verified" ? "Verified" : "Pending"}
                </span>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                <span className="text-slate-300 text-sm">Risk Assessment</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${profileCompleted ? "text-green-400" : "text-blue-400"}`}>
                  {profileCompleted ? "Completed" : "Action Req."}
                </span>
              </div>
            </div>

            {kycStatus !== "verified" && (
              <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-center space-y-3">
                <p className="text-sm text-slate-300">Complete your verification to unlock trading features.</p>
                <button
                  onClick={() => navigate("/kyc")}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6 py-2 rounded-xl font-bold transition-all"
                >
                  Start KYC Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
