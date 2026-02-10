import { logoutUser, getCurrentUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { fetchGoals } from "../api/goal";
import { getHoldings, getTransactions } from "../api/portfolio";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [goals, setGoals] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // ✅ Market data for graph
  const [marketData, setMarketData] = useState({});

  // ✅ Symbol → Company name mapping
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

        if (isMounted) setUser(userData);

        try {
          const g = await fetchGoals();
          if (isMounted) setGoals(g.data || []);
        } catch {}

        try {
          const h = await getHoldings(1);
          if (isMounted) setHoldings(h || []);
        } catch {}

        try {
          const t = await getTransactions(1);
          if (isMounted) setTransactions(t || []);
        } catch {}

        // ✅ Fetch market snapshot
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Loading dashboard...
      </div>
    );
  }

  // ====== GOALS SUMMARY ======
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

  // ====== PORTFOLIO SUMMARY ======
  const totalTransactions = transactions.length;
  const lastTx = transactions[0];
  const lastTxText = lastTx
    ? `${String(lastTx.type).toUpperCase()} ${lastTx.symbol} (₹${lastTx.price})`
    : "-";

  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + Number(h.cost_basis || 0),
    0
  );

  // ====== MARKET GRAPH ======
  const maxMarketValue = Math.max(...Object.values(marketData || {}), 1);

  return (
    <div className="min-h-screen text-gray-900">
      {/* Header */}
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
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full"
            >
              Logout
            </button>

            {/* Profile icon */}
            <button
              onClick={() => navigate("/profile")}
              className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center"
              title="Profile"
            >
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-6">

        {/* Welcome */}
        <div className="bg-white/80 rounded-xl shadow-lg p-8">
          <h2 className="text-4xl font-bold mb-2">
            Welcome to Your Dashboard
          </h2>
          <p className="text-gray-700 text-lg">
            Track your goals, portfolio, and market trends.
          </p>
        </div>

        {/* Summaries */}
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

        {/* Market Snapshot Graph */}
        <div className="bg-white/85 rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-orange-800 mb-4">
            Market Snapshot (Daily)
          </h3>

          <div className="space-y-4">
            {Object.entries(marketData).map(([symbol, value]) => (
              <div key={symbol}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="font-semibold">
                    {companyNames[symbol] || symbol}
                  </span>
                  <span>${Number(value).toFixed(2)}</span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full"
                    style={{ width: `${(value / maxMarketValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Home;
