import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Recommendations() {
  const [data, setData] = useState(null);
  const [rebalance, setRebalance] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/recommendations/allocation")
      .then(res => res.json())
      .then(setData);

    fetch("http://127.0.0.1:8000/recommendations/rebalance")
      .then(res => res.json())
      .then(setRebalance);
  }, []);

  if (!data || !rebalance) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-300 via-rose-400 to-red-500 text-white text-lg">
        Loading recommendations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-rose-400 to-red-500">
      
      {/* 🌸 Header */}
      <div className="px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="text-white font-medium hover:opacity-80"
        >
          ← Back
        </button>

        <h1 className="text-xl font-semibold text-white tracking-wide">
          Portfolio Insights
        </h1>

        {/* User Icon */}
        <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white font-semibold shadow">
          U
        </div>
      </div>

      {/* 🌸 Content */}
      <div className="max-w-4xl mx-auto px-6 pb-10 space-y-6">
        
        {/* Risk Profile */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <h2 className="text-gray-700 text-sm uppercase tracking-wide mb-1">
            Risk Profile
          </h2>
          <p className="text-3xl font-bold text-pink-600 capitalize">
            {data.risk_profile}
          </p>
        </div>

        {/* Allocations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Recommended */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-700 font-semibold mb-4">
              Recommended Allocation
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>Equity <span className="float-right font-semibold">{data.recommended.equity}%</span></li>
              <li>Debt <span className="float-right font-semibold">{data.recommended.debt}%</span></li>
              <li>Cash <span className="float-right font-semibold">{data.recommended.cash}%</span></li>
            </ul>
          </div>

          {/* Current */}
          <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
            <h3 className="text-gray-700 font-semibold mb-4">
              Current Allocation
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>Equity <span className="float-right font-semibold">{data.current.equity}%</span></li>
              <li>Debt <span className="float-right font-semibold">{data.current.debt}%</span></li>
              <li>Cash <span className="float-right font-semibold">{data.current.cash}%</span></li>
            </ul>
          </div>
        </div>

        {/* Rebalance Suggestions */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6">
          <h3 className="text-gray-700 font-semibold mb-4">
            Rebalancing Suggestions
          </h3>

          {rebalance.suggestions.length === 0 ? (
            <p className="text-green-600 font-medium">
              🌼 Your portfolio is beautifully balanced.
            </p>
          ) : (
            <ul className="space-y-3">
              {rebalance.suggestions.map((s, i) => (
                <li
                  key={i}
                  className={`px-4 py-3 rounded-xl font-medium ${
                    s.action === "increase"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
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
