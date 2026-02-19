// src/pages/SimulationResult.jsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import html2canvas from "html2canvas";
import { useRef } from "react";

function SimulationResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const chartRef = useRef(null);

  if (!state) {
    navigate("/simulation");
    return null;
  }

  const { scenario_name, results } = state;
  const surplusPositive = results.surplus >= 0;

  const downloadChart = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement("a");
    link.download = `${scenario_name}_simulation_chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen text-gray-900 bg-gradient-to-br from-pink-400 via-orange-400 to-orange-300">

      {/* ===== App Header ===== */}
      <header className="backdrop-blur-md bg-white/70 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Back */}
          <button
            onClick={() => navigate("/simulation")}
            className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium"
          >
            ← Back
          </button>

          <h1 className="text-xl font-bold text-orange-800">
            Simulation Result
          </h1>

          {/* Profile */}
          <div
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-gray-900 text-white
                       flex items-center justify-center font-semibold cursor-pointer"
            title="Profile"
          >
            A
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Scenario Info */}
        <div className="bg-white/80 rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {scenario_name}
          </h2>
          <p className="text-gray-600 mt-2">
            Here’s how your investment performs over time.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-5 text-center">
            <p className="text-sm text-gray-500">Total Invested</p>
            <p className="text-2xl font-bold mt-1">
              ₹{results.total_invested.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 text-center">
            <p className="text-sm text-gray-500">Future Value</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              ₹{results.future_value.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5 text-center">
            <p className="text-sm text-gray-500">Inflation Adjusted</p>
            <p className="text-2xl font-bold mt-1 text-orange-600">
              ₹{results.inflation_adjusted_value.toLocaleString()}
            </p>
          </div>

          <div
            className={`bg-white rounded-xl shadow-lg p-5 text-center ${
              surplusPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            <p className="text-sm text-gray-500">Surplus</p>
            <p className="text-2xl font-bold mt-1">
              ₹{results.surplus.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              Investment Growth Over Time
            </h3>

            <button
              onClick={downloadChart}
              className="px-4 py-2 text-sm font-medium rounded-lg
                         bg-gray-100 hover:bg-gray-200 transition"
            >
              Download Chart
            </button>
          </div>

          <div ref={chartRef}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart
                data={results.yearly_breakdown}
                margin={{ top: 10, right: 20, left: 45, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis dataKey="year" />

                <YAxis
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString()}`
                  }
                />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="future_value"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />

                <Line
                  type="monotone"
                  dataKey="inflation_adjusted_value"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SimulationResult;
