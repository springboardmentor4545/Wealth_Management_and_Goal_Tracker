import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import axios from "axios";

export default function Kyc() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleChoice = async (status) => {
    if (status === "unverified") {
      navigate("/dashboard");
      return;
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("access_token");
      const name = localStorage.getItem("name") || "User";

      const form = new FormData();
      form.append("name", name);
      form.append("pan", "CHOICE_VERIFIED");

      await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/kyc/submit",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("kyc_status", "verified")
      toast.success("Status Updated Successfully")
      navigate("/dashboard")
    } catch (err) {
      toast.error("Process failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative font-sans text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_60%)]"></div>

      <div className="relative w-full max-w-xl text-center">
        <div className="glass-card p-12 border-white/10 space-y-12 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>

          <div className="space-y-4">
            <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-blue-600/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] group">
              <svg className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Account Status</p>
            <h1 className="text-4xl font-black tracking-tight">Identity Verification</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic leading-relaxed">Secure your account with a simple confirmation.</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-widest">Is your account verified?</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mx-auto">Please confirm if your KYC documents have already been processed.</p>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleChoice("verified")}
                disabled={loading}
                className="group p-8 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-400 rounded-[2rem] transition-all duration-500 flex flex-col items-center gap-2 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-xl font-black uppercase tracking-tight relative z-10 group-hover:text-white transition-colors">Yes, Verified</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 group-hover:text-blue-200 relative z-10">Credentials Logged</span>
              </button>

              <button
                onClick={() => handleChoice("unverified")}
                disabled={loading}
                className="group p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-white/10 rounded-[2rem] transition-all duration-500 flex flex-col items-center gap-1"
              >
                <span className="text-sm font-black text-slate-500 group-hover:text-white transition-colors uppercase tracking-[0.1em]">No, Not Yet</span>
                <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-500 uppercase tracking-widest leading-none">Handle later in profile</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[10px] font-black tracking-[0.4em] uppercase text-blue-500">Updating Status</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
