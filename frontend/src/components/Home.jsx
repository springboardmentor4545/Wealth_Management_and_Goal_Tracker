// import { useNavigate } from "react-router-dom";
// import { logoutUser } from "../api/auth";

// export default function Home() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logoutUser();
//     navigate("/login");
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-[#FFF7E6] to-white">

//       {/* Header */}
//       <header className="bg-white border-b">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-indigo-600">
//               Wealth Management
//             </h1>
//             <p className="text-sm text-gray-500">
//               Smart & Personalized Investment Planning
//             </p>
//           </div>

//           <button
//             onClick={handleLogout}
//             className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="flex justify-center px-6 py-10">
//         <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-8">

//           {/* Welcome Section */}
//           <h2 className="text-2xl font-semibold text-gray-800">
//             Welcome, Keerthana ✨
//           </h2>

//           <p className="text-gray-500 mt-2">
//             Personalized wealth planning tailored to your financial profile.
//           </p>

//           {/* Risk Assessment Card */}
//           <div className="mt-8 border border-indigo-200 bg-indigo-50 rounded-xl p-6">
//             <h3 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
//               📋 Risk Profiling
//             </h3>

//             <p className="text-indigo-600 mt-2">
//               Answer a few simple questions to help us understand your investment preferences.
//             </p>

//             <button
//               onClick={() => navigate("/risk-assessment")}
//               className="mt-5 px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-lg font-medium transition"


//             >
//               Complete Your Risk Profile
//             </button>
//           </div>

//         </div>
//       </main>
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";
import { logoutUser, getCurrentUser } from "../api/auth";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const riskProfileLabel = user?.risk_profile
    ? `${user.risk_profile.slice(0, 1).toUpperCase()}${user.risk_profile.slice(1)}`
    : "Unknown";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
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

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-appBg">
      {/* Main Content */}
      <main className="flex justify-center px-6 py-10">
        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-semibold text-textPrimary">
            Welcome to your dashboard, {user?.name}
          </h2>
          <p className="text-textSecondary mt-2">
            Here is a quick snapshot of your progress and next steps.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-cardBg rounded-2xl border border-borderLight p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="text-[15px] font-semibold text-textPrimary">
                Risk Profile
              </div>
              {user?.profile_completed ? (
                <>
                  <div className="mt-3 text-[14px] font-semibold text-success">
                    Completed
                  </div>
                  <div className="mt-2 text-[14px] text-textSecondary">
                    Risk level: {riskProfileLabel}
                  </div>
                  {typeof user?.risk_score === "number" && (
                    <div className="mt-1 text-[13px] text-textMuted">
                      Score: {user.risk_score}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-3 text-[14px] font-semibold text-warning">
                    Not completed
                  </div>
                  <div className="mt-2 text-[14px] text-textSecondary">
                    Complete assessment to get recommendations.
                  </div>
                  <button
                    onClick={() => navigate("/risk-assessment")}
                    className="mt-5 px-4 py-2 rounded-lg bg-warning text-white text-[14px] font-medium transition hover:-translate-y-[1px] active:translate-y-0"
                  >
                    Complete Assessment
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
