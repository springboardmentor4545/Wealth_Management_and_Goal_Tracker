import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);

  const [portfolioValue, setPortfolioValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [portfolioData, setPortfolioData] = useState([]);
  const [investVsCurrentData, setInvestVsCurrentData] = useState([]);

  const [portfolioGrowth, setPortfolioGrowth] = useState([]);
  const [allocationData, setAllocationData] = useState([]);

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

    api.get("/goals").then((res) => {
      setGoals(res.data);
    });

    loadPortfolio();
    loadPortfolioGrowth();
    loadAllocation();
  }, [navigate]);

  const loadPortfolio = async () => {
    const res = await api.get("/portfolio/holdings");

    const data = res.data.map((item) => ({
      symbol: item.symbol,
      current_value: Number(item.current_value || 0),
      invested: Number(item.cost_basis || 0),
      updated_at: item.last_price_updated_at + "Z",
    }));

    setPortfolioData(data);

    const totalCurrent = data.reduce((sum, h) => sum + h.current_value, 0);
    const totalInvested = data.reduce((sum, h) => sum + h.invested, 0);

    setPortfolioValue(totalCurrent);

    setInvestVsCurrentData([
      { name: "Invested", amount: totalInvested },
      { name: "Current", amount: totalCurrent },
    ]);

    if (data.length > 0) {
      const latest = data.reduce((latest, item) => {
        if (!latest) return item;
        return new Date(item.updated_at) > new Date(latest.updated_at)
          ? item
          : latest;
      }, null);

      setLastUpdated(latest?.updated_at || null);
    }
  };

  const loadPortfolioGrowth = async () => {
    const res = await api.get("/portfolio/transactions");

    const sorted = res.data.sort(
      (a, b) => new Date(a.executed_at) - new Date(b.executed_at)
    );

    let total = 0;
    const timeline = [];

    sorted.forEach((txn) => {
      const value = Number(txn.quantity) * Number(txn.price);

      if (txn.type === "buy") total += value;
      if (txn.type === "sell") total -= value;

      timeline.push({
        date: new Date(txn.executed_at).toLocaleDateString(),
        value: Number(total.toFixed(2)),
      });
    });

    setPortfolioGrowth(timeline);
  };

  const loadAllocation = async () => {
    try {
      const res = await api.get("/recommendation/");
      const allocation = res.data.current_allocation;

      const formatted = Object.entries(allocation).map(([key, value]) => ({
        name: key,
        value: Number(value),
      }));

      setAllocationData(formatted);
    } catch (err) {
      console.error("Allocation load failed", err);
    }
  };

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

        {/* Goals */}
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
            <StatCard label="Total Goals" value={goals.length} color="green" />
            <StatCard label="Active" value={goals.filter(g => g.status==="active").length} color="pink" />
            <StatCard label="Paused" value={goals.filter(g => g.status==="paused").length} color="yellow" />
            <StatCard label="Completed" value={goals.filter(g => g.status==="completed").length} color="purple" />
          </div>
        </div>

        {/*  PORTFOLIO CARDS */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Portfolio Value */}
          <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
            <div className="flex justify-between items-center mb-3">
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

            <h3 className="text-lg font-semibold text-blue-600 text-center mb-1">
              Portfolio Value
            </h3>

            <p className="text-3xl font-bold text-center mb-1">
              ₹{portfolioValue.toFixed(2)}
            </p>

            <p className="text-xs text-gray-500 text-center mb-4">
              Last updated:{" "}
              {lastUpdated
                ? new Date(lastUpdated).toLocaleString()
                : "Updating..."}
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={portfolioData}
                  dataKey="current_value"
                  nameKey="symbol"
                  outerRadius={90}
                >
                  {portfolioData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Invested vs Current */}
          <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
            <h3 className="text-xl font-bold text-blue-600 mb-10 text-center">
              Invested vs Current Value
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={investVsCurrentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Growth + Allocation */}
        <div className="grid md:grid-cols-2 gap-8">

          <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
            <h3 className="text-xl font-bold text-green-600 mb-6 text-center">
              Portfolio Growth Over Time
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`${cardClass} rounded-2xl shadow-lg p-8`}>
            <h3 className="text-xl font-bold text-blue-600 mb-6 text-center">
              Asset Allocation Breakdown
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={allocationData} dataKey="value" label>
                  {allocationData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    green: "bg-green-200 text-green-900",
    pink: "bg-pink-200 text-pink-900",
    yellow: "bg-yellow-200 text-yellow-900",
    purple: "bg-purple-200 text-purple-900",
  };

  return (
    <div className={`rounded-xl p-4 text-center ${colors[color]}`}>
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
