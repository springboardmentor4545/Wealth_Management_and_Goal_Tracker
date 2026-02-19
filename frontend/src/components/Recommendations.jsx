import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ---------- Donut Chart (Reusable) ---------- */
function DonutChart({ equity, debt, cash, colors }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Normalize to avoid missing segments
  const total = equity + debt + cash;
  const eqPct = (equity / total) * 100;
  const dbPct = (debt / total) * 100;
  const csPct = (cash / total) * 100;

  const eq = (eqPct / 100) * circumference;
  const db = (dbPct / 100) * circumference;
  const cs = (csPct / 100) * circumference;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <g transform="translate(80,80) rotate(-90)">
        {/* base ring */}
        <circle
          r={radius}
          cx="0"
          cy="0"
          fill="transparent"
          stroke="#f1f5f9"
          strokeWidth="14"
        />

        {/* Equity */}
        <circle
          r={radius}
          cx="0"
          cy="0"
          fill="transparent"
          stroke={colors.equity}
          strokeWidth="14"
          strokeDasharray={`${eq} ${circumference}`}
        />

        {/* Debt */}
        <circle
          r={radius}
          cx="0"
          cy="0"
          fill="transparent"
          stroke={colors.debt}
          strokeWidth="14"
          strokeDasharray={`${db} ${circumference}`}
          strokeDashoffset={-eq}
        />

        {/* Cash */}
        <circle
          r={radius}
          cx="0"
          cy="0"
          fill="transparent"
          stroke={colors.cash}
          strokeWidth="14"
          strokeDasharray={`${cs} ${circumference}`}
          strokeDashoffset={-(eq + db)}
        />
      </g>
    </svg>
  );
}

function Recommendations() {
  const [data, setData] = useState(null);
  const [rebalance, setRebalance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get("http://127.0.0.1:8000/recommendations/allocation", { headers })
      .then((res) => setData(res.data));

    axios
      .get("http://127.0.0.1:8000/recommendations/rebalance", { headers })
      .then((res) => setRebalance(res.data));
  }, [navigate]);

  if (!data || !rebalance) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-200 via-rose-300 to-fuchsia-400">
        Loading portfolio insights...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-200 to-raspberry-300">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-600">
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          Portfolio Insights
        </h1>
        <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-semibold">
          U
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Risk Profile */}
        <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 uppercase">Risk Profile</p>
            <p className="text-2xl font-bold text-rose-600 capitalize">
              {data.risk_profile}
            </p>
          </div>
          <span className="px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-medium">
            Investor Type
          </span>
        </div>

        {/* Allocation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recommended Allocation */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <h3 className="font-semibold text-gray-800 mb-4">
              Recommended Allocation
            </h3>

            <DonutChart
              equity={data.recommended.equity}
              debt={data.recommended.debt}
              cash={data.recommended.cash}
              colors={{
                equity: "#ec4899", // raspberry
                debt: "#fb7185",   // blush
                cash: "#fda4af",   // soft pink
              }}
            />

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-pink-600">● Equity {data.recommended.equity}%</p>
              <p className="text-rose-500">● Debt {data.recommended.debt}%</p>
              <p className="text-pink-400">● Cash {data.recommended.cash}%</p>
            </div>
          </div>

          {/* Current Allocation (FIXED → Donut Added) */}
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
            <h3 className="font-semibold text-gray-800 mb-4">
              Current Allocation
            </h3>

            <DonutChart
              equity={data.current.equity}
              debt={data.current.debt}
              cash={data.current.cash}
              colors={{
                equity: "#f472b6",
                debt: "#f43f5e",
                cash: "#fbcfe8",
              }}
            />

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-pink-500">● Equity {data.current.equity}%</p>
              <p className="text-rose-600">● Debt {data.current.debt}%</p>
              <p className="text-pink-300">● Cash {data.current.cash}%</p>
            </div>
          </div>
        </div>

        {/* Rebalancing */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">
            Rebalancing Suggestions
          </h3>

          {rebalance.suggestions.length === 0 ? (
            <div className="p-4 rounded-xl bg-green-50 text-green-700 font-medium">
              ✅ Portfolio is already well balanced
            </div>
          ) : (
            <ul className="space-y-3">
              {rebalance.suggestions.map((s, i) => (
                <li
                  key={i}
                  className={`p-4 rounded-xl font-medium ${
                    s.action === "increase"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {s.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;
