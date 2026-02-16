import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [portfolioData, setPortfolioData] = useState([]);

  const COLORS = [
    "hotpink",
    "orange",
    "yellowgreen",
    "mediumturquoise",
    "dodgerblue",
    "mediumseagreen",
    "goldenrod",
    "purple",
    "tomato",
    "cyan",
  ];

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));

    api.get("/goals").then((res) => setGoals(res.data));

    api.get("/portfolio/holdings").then((res) => {
      // Prepare chart data
      const data = res.data.map((item) => ({
        symbol: item.symbol,
        current_value: Number(item.current_value || 0),
        updated_at: item.last_price_updated_at+'Z',
      }));

      setPortfolioData(data);

      // Total portfolio value
      const total = data.reduce((sum, h) => sum + h.current_value, 0);
      setPortfolioValue(total);

      // ✅ FIX: find MOST RECENT last_price_updated_at
      if (data.length > 0) {
        const latest = data.reduce((latest, item) => {
          if (!latest) return item;
          return new Date(item.updated_at) > new Date(latest.updated_at)
            ? item
            : latest;
        }, null);

        setLastUpdated(latest?.updated_at || null);
      }
    });
  }, [navigate]);

  if (!user) return null;

  const cardClass =
    theme === "dark"
      ? "bg-gray-800 text-gray-100 border border-gray-700"
      : "bg-white text-gray-700";

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Welcome */}
        <div className={`${cardClass} rounded-2xl shadow-lg p-8 text-center`}>
          <h2 className="text-2xl font-bold mb-1 text-blue-500 dark:text-blue-300">
            Welcome, {user.name} 👋
          </h2>
          <p className="text-gray-500">
            Manage your financial goals and track your progress easily.
          </p>
        </div>

        {/* Goals Summary */}
        <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-pink-600 dark:text-pink-400">
              Goals Summary
            </h3>
            <button
              onClick={() => navigate("/goals")}
              className="text-pink-600 hover:text-pink-700 font-bold"
            >
              View Goals →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl p-4 text-center bg-green-200">
              <p className="text-sm text-green-900">Total Goals</p>
              <p className="text-2xl font-bold text-green-900">
                {goals.length}
              </p>
            </div>

            <div className="rounded-xl p-4 text-center bg-pink-200">
              <p className="text-sm text-pink-900">Active</p>
              <p className="text-2xl font-bold text-pink-900">
                {goals.filter((g) => g.status === "active").length}
              </p>
            </div>

            <div className="rounded-xl p-4 text-center bg-yellow-200">
              <p className="text-sm text-yellow-900">Paused</p>
              <p className="text-2xl font-bold text-yellow-900">
                {goals.filter((g) => g.status === "paused").length}
              </p>
            </div>

            <div className="rounded-xl p-4 text-center bg-purple-200">
              <p className="text-sm text-purple-900">Completed</p>
              <p className="text-2xl font-bold text-purple-900">
                {goals.filter((g) => g.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-orange-500">
              Portfolio Summary
            </h3>
            <button
              onClick={() => navigate("/portfolio")}
              className="text-orange-500 hover:text-orange-600 font-bold"
            >
              View Portfolio →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 pt-8 pl-6">
              <p className="text-3xl font-semibold leading-tight mb-2">
                ₹{portfolioValue.toFixed(2)}
              </p>

              <p className="text-sm text-gray-500 mb-1">
                Last updated:{" "}
                {lastUpdated
                  ? new Date(lastUpdated).toLocaleString()
                  : "Updating..."}
              </p>

              <p className="text-gray-500">
                Track stocks, ETFs, mutual funds & more.
              </p>
            </div>

            <div className="md:col-span-2 w-full h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    dataKey="current_value"
                    nameKey="symbol"
                    cx="45%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) =>
                      `${entry.symbol}: ₹${entry.current_value.toLocaleString()}`
                    }
                    isAnimationActive={false}
                  >
                    {portfolioData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(value).toLocaleString()}`
                    }
                  />

                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="top"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
