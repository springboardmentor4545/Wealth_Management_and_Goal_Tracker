import { logoutUser, getCurrentUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";

import { fetchGoals } from "../api/goal";
import { getHoldings, getTransactions } from "../api/portfolio";

// 📊 Chart imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

// 📥 Download chart
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

function Home() {
  const navigate = useNavigate();

  // 🔗 refs for each chart box
  const growthRef = useRef(null);
  const allocationRef = useRef(null);
  const investedRef = useRef(null);
  const goalRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const [goals, setGoals] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [marketData, setMarketData] = useState({});

  const companyNames = {
    AAPL: "Apple",
    AMZN: "Amazon",
    GOOGL: "Google",
    MSFT: "Microsoft",
    TSLA: "Tesla",
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      try {
        const userData = await getCurrentUser();
        if (!userData) throw new Error("No user");

        const riskCompleted = localStorage.getItem("riskCompleted");
        if (!riskCompleted) {
          navigate("/risk-assessment");
          return;
        }

        if (isMounted) setUser(userData);

        try {
          const g = await fetchGoals();
          if (isMounted) setGoals(g?.data ?? g ?? []);
        } catch {}

        try {
          const h = await getHoldings();
          if (isMounted) setHoldings(h || []);
        } catch {}

        try {
          const t = await getTransactions();
          if (isMounted) setTransactions(t || []);
        } catch {}

        const res = await fetch("http://127.0.0.1:8000/market/latest");
        const data = await res.json();
        if (isMounted) setMarketData(data);
      } catch (err) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAll();
    return () => (isMounted = false);
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    toast.success("Logout successful");
    setTimeout(() => navigate("/login"), 800);
  };

  // 📥 download helper
  const downloadChart = async (ref, name) => {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(img, "PNG", 10, 10, 190, 0);
    pdf.save(`${name}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Loading dashboard...
      </div>
    );
  }

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;

  const avgProgress =
    totalGoals === 0
      ? 0
      : Math.round(
          goals.reduce(
            (sum, g) => sum + Number(g.completion_percentage || 0),
            0
          ) / totalGoals
        );

  const nextTargetDate = (() => {
    const futureDates = goals
      .map((g) => g.target_date)
      .filter(Boolean)
      .map((d) => new Date(d))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    return futureDates.length ? futureDates[0].toLocaleDateString() : "-";
  })();

  const totalTransactions = transactions.length;
  const lastTx = transactions[0];
  const lastTxText = lastTx
    ? `${String(lastTx.type).toUpperCase()} ${lastTx.symbol} (₹${lastTx.price})`
    : "-";

  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + Number(h.cost_basis || 0),
    0
  );

  return (
    <div className="min-h-screen text-gray-900 bg-gradient-to-br from-red-400 via-orange-400 to-yellow-300">
      {/* HEADER — unchanged */}
      <header className="backdrop-blur-md bg-white/70 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-orange-800">WealthIQ</h1>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/portfolio")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-full"
            >
              Portfolio
            </button>

            <button
              onClick={() => navigate("/market")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full"
            >
              Market
            </button>

            <button
              onClick={() => navigate("/set-goal")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-full"
            >
              Set Goal
            </button>

            <button
              onClick={() => navigate("/recommendations")}
              className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-full"
            >
              Recommendations
            </button>

            <button
              onClick={() => navigate("/simulation")}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full"
            >
              Simulation
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center"
              >
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT — summaries unchanged */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="bg-white/80 rounded-xl shadow-lg p-8">
          <h2 className="text-4xl font-bold mb-2">Welcome to Your Dashboard</h2>
          <p className="text-gray-700 text-lg">
            Track your goals, portfolio, and market trends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/85 rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-orange-800 mb-3">
              Goals Summary
            </h3>
            <p>Total Goals: {totalGoals}</p>
            <p>Active Goals: {activeGoals}</p>
            <p>Average Progress: {avgProgress}%</p>
            <p>Next Target Date: {nextTargetDate}</p>
          </div>

          <div className="bg-white/85 rounded-xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-blue-800 mb-3">
              Portfolio Summary
            </h3>
            <p>Total Transactions: {totalTransactions}</p>
            <p>Last Transaction: {lastTxText}</p>
            <p>Total Portfolio Value: ₹{totalPortfolioValue.toFixed(2)}</p>
          </div>
        </div>

        {/* 📊 GRAPHS SECTION — only enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Portfolio Growth */}
<div ref={growthRef} className="bg-white/85 rounded-xl shadow-lg p-6">
  <div className="flex justify-between mb-2">
    <h3 className="font-bold">Portfolio Growth Over Time</h3>
    <button
      onClick={() => downloadChart(growthRef, "Portfolio_Growth")}
      className="text-sm text-blue-600"
    >
      Download
    </button>
  </div>

  <Line
    data={{
      labels: [...transactions]
        .sort(
          (a, b) =>
            new Date(a.executed_at) -
            new Date(b.executed_at)
        )
        .map((t) =>
          new Date(t.executed_at).toLocaleDateString()
        ),
      datasets: [
        {
          label: "Portfolio Value",
          data: (() => {
            let value = 0;
            return [...transactions]
              .sort(
                (a, b) =>
                  new Date(a.executed_at) -
                  new Date(b.executed_at)
              )
              .map((t) => {
                const amt = t.quantity * t.price;
                value += t.type === "buy" ? amt : -amt;
                return value;
              });
          })(),
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.35)",
          fill: true,
          tension: 0.4,
        },
      ],
    }}
  />
</div>

{/* Asset Allocation */}
<div ref={allocationRef} className="bg-white/85 rounded-xl shadow-lg p-6">
  <div className="flex justify-between mb-2">
    <h3 className="font-bold">Asset Allocation</h3>
    <button
      onClick={() =>
        downloadChart(allocationRef, "Asset_Allocation")
      }
      className="text-sm text-blue-600"
    >
      Download
    </button>
  </div>

  <Doughnut
    data={{
      labels: [...new Set(holdings.map((h) => h.asset_type))],
      datasets: [
        {
          data: Object.values(
            holdings.reduce((acc, h) => {
              acc[h.asset_type] =
                (acc[h.asset_type] || 0) + h.cost_basis;
              return acc;
            }, {})
          ),
          backgroundColor: ["#60a5fa", "#34d399", "#fbbf24"],
          borderWidth: 1,
        },
      ],
    }}
    options={{
      cutout: "65%",
      plugins: {
        legend: { position: "bottom" },
      },
    }}
  />
</div>

{/* Invested vs Current */}
<div ref={investedRef} className="bg-white/85 rounded-xl shadow-lg p-6">
  <div className="flex justify-between mb-2">
    <h3 className="font-bold">Invested vs Current Value</h3>
    <button
      onClick={() =>
        downloadChart(investedRef, "Invested_vs_Current")
      }
      className="text-sm text-blue-600"
    >
      Download
    </button>
  </div>

  <Bar
    data={{
      labels: ["Invested", "Current"],
      datasets: [
        {
          data: [
            holdings.reduce((s, h) => s + h.cost_basis, 0),
            holdings.reduce(
              (s, h) =>
                s +
                h.units *
                  (marketData[h.symbol] || h.avg_buy_price),
              0
            ),
          ],
          backgroundColor: ["#fb7185", "#4ade80"],
        },
      ],
    }}
  />
</div>

{/* Goal Progress */}
<div ref={goalRef} className="bg-white/85 rounded-xl shadow-lg p-6">
  <div className="flex justify-between mb-2">
    <h3 className="font-bold">Goal Progress</h3>
    <button
      onClick={() =>
        downloadChart(goalRef, "Goal_Progress")
      }
      className="text-sm text-blue-600"
    >
      Download
    </button>
  </div>

  <Bar
    data={{
      labels: goals.map((g) => g.goal_type),
      datasets: [
        {
          data: goals.map((g) => g.completion_percentage),
          backgroundColor: "#60a5fa",
        },
      ],
    }}
    options={{
      indexAxis: "y",
      scales: { x: { max: 100 } },
    }}
  />
</div>
        </div>
      </main>
    </div>
  );
}

export default Home;

