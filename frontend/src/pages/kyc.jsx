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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative font-sans text-white">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-lg text-center">
        <div className="bg-white/5 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/10 space-y-10 shadow-2xl">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h1 className="text-3xl font-bold">KYC Status</h1>
            <p className="text-slate-400 text-sm italic">"One simple step for your security"</p>
          </div>

          <h2 className="text-xl font-medium">Is your KYC verified?</h2>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleChoice("verified")}
              disabled={loading}
              className="group p-6 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-400 rounded-3xl transition-all duration-300 flex flex-col items-center gap-2"
            >
              <span className="text-xl font-bold group-hover:scale-105 transition-transform">Yes, I am verified</span>
              <span className="text-xs text-blue-400 group-hover:text-blue-100">Documents already processed</span>
            </button>

            <button
              onClick={() => handleChoice("unverified")}
              disabled={loading}
              className="group p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl transition-all duration-300 flex flex-col items-center gap-2"
            >
              <span className="text-xl font-bold text-slate-300 group-hover:text-white transition-colors">No, not verified</span>
              <span className="text-xs text-slate-500 group-hover:text-slate-400">Complete this later in your profile</span>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 text-blue-400">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs font-bold tracking-widest uppercase">Syncing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
