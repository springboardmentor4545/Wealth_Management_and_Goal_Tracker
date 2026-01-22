import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCurrentUser, logoutUser } from "../api/auth";

export default function HomeWelcome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        if (data?.profile_completed) {
          navigate("/dashboard");
          return;
        }
        setUser(data);
      } catch {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="w-full px-6 py-6 flex items-center justify-between">
          <div />
          <button
            type="button"
            onClick={() => {
              logoutUser();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-[#EF4444] hover:text-[#DC2626] font-semibold transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="flex justify-center px-6 py-10">
        <div className="w-full max-w-5xl bg-[#0B0B0F] rounded-2xl shadow-md p-5">
          <h2 className="text-2xl font-semibold text-white">
            Welcome to Wealth Management
          </h2>
          <p className="text-white/70 mt-2">
            Let&apos;s understand your financial preferences before we begin.
          </p>

          <div className="mt-6 bg-[#3A3A3A] rounded-2xl p-8 shadow-sm max-w-4xl border border-white/10">
            <h3 className="text-lg font-semibold text-white">
              Risk Assessment
            </h3>
            <p className="text-sm text-white/70 mt-2 mb-6">
              Answer a few questions to help us personalize your investment strategy.
            </p>
            <button
              onClick={() => navigate("/risk-assessment")}
              className="h-[46px] px-8 rounded-2xl bg-[#FBBF24] hover:bg-[#F5B60A] text-white text-[17px] font-semibold transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
            >
              Complete Your Risk Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
