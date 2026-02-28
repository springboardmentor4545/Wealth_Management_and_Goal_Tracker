import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar
} from 'recharts';
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const name = localStorage.getItem("name") || "User";
  const [stats, setStats] = useState({
    investments: [],
    goals: [],
    transactions: [],
    loading: true,
    isRefreshing: false
  });
  const [growthTimeRange, setGrowthTimeRange] = useState('ALL');

  useEffect(() => {
    const initDashboard = async () => {
      await fetchData();
      checkAndRefreshPrices();
    };
    initDashboard();
  }, []);

  const checkAndRefreshPrices = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get last refresh time
      const refreshRes = await axios.get("http://127.0.0.1:8000/api/v1/portfolio/last-refresh", { headers });
      const lastRefresh = refreshRes.data.last_refresh_at;

      // 2. If no refresh data or last refresh > 24 hours ago, trigger update
      const iahAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (!lastRefresh || new Date(lastRefresh) < iahAgo) {
        console.log("Prices are stale or missing, triggering lazy update...");
        handleRefreshPrices();
      }
    } catch (err) {
      console.error("Error checking refresh status:", err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, goalRes, txRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/v1/portfolio/investments", { headers }),
        axios.get("http://127.0.0.1:8000/api/v1/goals", { headers }),
        axios.get("http://127.0.0.1:8000/api/v1/portfolio/transactions", { headers })
      ]);

      setStats({
        investments: invRes.data,
        goals: goalRes.data,
        transactions: txRes.data,
        loading: false
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Failed to load dashboard data");
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setStats(prev => ({ ...prev, isRefreshing: true }));
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post("http://127.0.0.1:8000/api/v1/portfolio/update-prices", {}, { headers });

      await fetchData();
      setStats(prev => ({ ...prev, isRefreshing: false }));
      toast.success("Dashboard updated successfully");

    } catch (err) {
      console.error("Refresh error:", err);
      toast.error("Failed to trigger price update");
      setStats(prev => ({ ...prev, isRefreshing: false }));
    }
  };

  const totalNetWorth = useMemo(() => {
    return stats.investments.reduce((acc, inv) => acc + (inv.current_value || 0), 0);
  }, [stats.investments]);

  const portfolioData = useMemo(() => {
    const allocation = stats.investments.reduce((acc, inv) => {
      const type = inv.asset_type || 'Other';
      // Format nicely: stock -> Stocks, etf -> ETFs, bond -> Bonds
      const formatted = type === 'stock' ? 'Stocks' :
        type === 'etf' ? 'ETFs' :
          type === 'bond' ? 'Bonds' :
            type === 'mutual_fund' ? 'Mutual Funds' :
              type === 'cash' ? 'Cash' :
                type.charAt(0).toUpperCase() + type.slice(1);

      acc[formatted] = (acc[formatted] || 0) + Number(inv.current_value || 0);
      return acc;
    }, {});

    const totalValue = Object.values(allocation).reduce((sum, val) => sum + val, 0);

    return Object.entries(allocation)
      .filter(([_, value]) => Number(value) > 0)
      .map(([name, value]) => ({
        name,
        value: Number(value),
        percentage: ((Number(value) / totalValue) * 100).toFixed(1)
      }));
  }, [stats.investments]);

  const growthData = useMemo(() => {
    if (stats.transactions.length === 0) return [];

    const now = new Date();
    let startDate = null;

    if (growthTimeRange === '1M') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (growthTimeRange === '1Y') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    // Sort transactions by date ascending
    const sortedTxs = [...stats.transactions].sort((a, b) => new Date(a.executed_at) - new Date(b.executed_at));

    let cumulativeValue = 0;
    let initialValue = 0;
    const history = [];

    sortedTxs.forEach(tx => {
      const txDate = new Date(tx.executed_at);
      const amount = (Number(tx.quantity) * Number(tx.price)) + (tx.type === 'buy' ? Number(tx.fees) : -Number(tx.fees));
      const txValue = (tx.type === 'buy' ? amount : -amount);

      cumulativeValue += txValue;

      if (!startDate || txDate >= startDate) {
        history.push({
          date: txDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fullDate: txDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          timestamp: txDate.getTime(),
          value: Number(cumulativeValue.toFixed(2))
        });
      } else {
        initialValue = cumulativeValue;
      }
    });

    // If we have a startDate and no points or just one point, ensure we have a start-of-window point
    if (startDate && history.length > 0) {
      const firstPointDate = new Date(history[0].timestamp);
      if (firstPointDate > startDate) {
        history.unshift({
          date: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          fullDate: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          timestamp: startDate.getTime(),
          value: Number(initialValue.toFixed(2))
        });
      }
    } else if (startDate && history.length === 0) {
      // If range selected but no transactions in range, show current total as flat line
      history.push({
        date: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: startDate.getTime(),
        value: Number(cumulativeValue.toFixed(2))
      });
      history.push({
        date: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        fullDate: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: now.getTime(),
        value: Number(cumulativeValue.toFixed(2))
      });
    }

    // Ensure the chart always extends to today
    const todayStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const fullTodayStr = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const lastPoint = history.length > 0 ? history[history.length - 1] : null;

    if (lastPoint && lastPoint.date !== todayStr) {
      history.push({
        date: todayStr,
        fullDate: fullTodayStr,
        timestamp: now.getTime(),
        value: Number(cumulativeValue.toFixed(2))
      });
    } else if (!lastPoint) {
      // Fallback for no transactions at all (though fetch should handle this)
      history.push({ date: todayStr, value: 0 });
    }

    // Group by date to show only one point per day initially
    const sortedHistory = history.reduce((acc, curr) => {
      const dateKey = curr.timestamp ? new Date(curr.timestamp).toDateString() : curr.date;
      const existing = acc.find(item => item.dateKey === dateKey);
      if (existing) {
        existing.value = curr.value;
      } else {
        acc.push({ ...curr, dateKey });
      }
      return acc;
    }, []);

    // Aggregation logic for 1Y/ALL (Month-wise)
    if (growthTimeRange === '1Y' || growthTimeRange === 'ALL') {
      const monthlyData = sortedHistory.reduce((acc, curr) => {
        const d = new Date(curr.timestamp || Date.now());
        const monthKey = `${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear()}`;

        // Always take the latest value for that month
        acc[monthKey] = {
          ...curr,
          date: d.toLocaleString(undefined, { month: 'short' }) // Display only month name on axis
        };
        return acc;
      }, {});

      return Object.values(monthlyData);
    }

    return sortedHistory;
  }, [stats.transactions, growthTimeRange]);

  const comparisonData = useMemo(() => {
    const totalInvested = stats.investments.reduce((acc, inv) => acc + Number(inv.cost_basis || 0), 0);
    const totalCurrentValue = stats.investments.reduce((acc, inv) => acc + Number(inv.current_value || 0), 0);

    return [
      { name: 'Invested', amount: Number(totalInvested.toFixed(2)) },
      { name: 'Current', amount: Number(totalCurrentValue.toFixed(2)) }
    ];
  }, [stats.investments]);


  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const topGainers = useMemo(() => {
    const gainers = stats.investments
      .filter(inv => inv.units > 0 && inv.daily_change !== undefined && inv.daily_change !== null)
      .sort((a, b) => Number(b.daily_change) - Number(a.daily_change))
      .slice(0, 1);
    console.log('All investments:', stats.investments);
    console.log('Top gainer by market price change:', gainers);
    return gainers;
  }, [stats.investments]);

  const topLosers = useMemo(() => {
    const losers = stats.investments
      .filter(inv => inv.units > 0 && inv.daily_change !== undefined && inv.daily_change !== null)
      .sort((a, b) => Number(a.daily_change) - Number(b.daily_change))
      .slice(0, 1);
    console.log('Top loser by market price change:', losers);
    return losers;
  }, [stats.investments]);


  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(79,70,229,0.08)_0%,transparent_50%)]"></div>

      <div className="relative max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        <Navbar />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">Dashboard</h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">{name}</span>
            </h1>
          </div>
          <button
            onClick={handleRefreshPrices}
            disabled={stats.isRefreshing}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all ${stats.isRefreshing
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95"
              }`}
          >
            {stats.isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-500/20 border-t-slate-500 rounded-full animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Refresh Prices
              </>
            )}
          </button>
        </header>

        {stats.loading ? (
          <div className="flex justify-center py-24">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Summary Cards */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 group hover:border-blue-500/30 transition-all">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500 mb-3">Total Net Worth</p>
                <p className="text-4xl font-black text-white tracking-tighter">
                  ₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>


              {/* Portfolio Growth Chart */}
              <div className="glass-card p-8 min-h-[400px] flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <h3 className="text-lg font-black tracking-tight">Portfolio Growth Over Time</h3>
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                    {['1M', '1Y', 'ALL'].map((range) => (
                      <button
                        key={range}
                        onClick={() => setGrowthTimeRange(range)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${growthTimeRange === range
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-slate-500 hover:text-white"
                          }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full flex items-center justify-center">
                  {growthData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={growthData} margin={{ top: 10, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                          tickFormatter={(value) => `₹${value.toLocaleString()}`}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#020617',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                          itemStyle={{ color: '#ffffff' }}
                          labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={4}
                          dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#020617' }}
                          activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                          animationDuration={2000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-600 font-bold uppercase tracking-widest text-xs">No growth data available</div>
                  )}
                </div>
              </div>

              {/* Asset Allocation and Invested vs Current */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Asset Allocation Pie Chart */}
                <div className="glass-card p-8 min-h-[400px] flex flex-col">
                  <h3 className="text-lg font-black tracking-tight mb-8 font-sans">Asset Allocation Breakdown</h3>
                  <div className="flex-1 w-full flex items-center justify-center">
                    {portfolioData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={portfolioData}
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={true}
                          >
                            {portfolioData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#020617',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                            labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                            itemStyle={{ color: '#ffffff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-600 font-bold uppercase tracking-widest text-xs">No allocation data</div>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {portfolioData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{entry.name} ({entry.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invested vs Current Value Comparison */}
                <div className="glass-card p-8 min-h-[400px] flex flex-col">
                  <h3 className="text-lg font-black tracking-tight mb-8">Invested vs Current Value</h3>
                  <div className="flex-1 w-full flex items-center justify-center">
                    {stats.investments.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                            tickFormatter={(value) => `₹${value.toLocaleString()}`}
                            width={80}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#020617',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                            labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                            itemStyle={{ color: '#ffffff' }}
                          />
                          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                            {comparisonData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-600 font-bold uppercase tracking-widest text-xs">No data to compare</div>
                    )}
                  </div>
                </div>
              </div>


            </div>

            {/* Sidebar with Goals and Market Insights */}
            <div className="space-y-8">
              {/* Goals List */}
              <div className="glass-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="text-lg font-black tracking-tight mb-8 flex items-center justify-between">
                  Upcoming Goals
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{stats.goals.length}</span>
                </h3>
                <div className="space-y-8">
                  {stats.goals.length === 0 ? (
                    <p className="text-slate-600 font-medium text-sm text-center py-12 italic">No goals set yet.</p>
                  ) : stats.goals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="space-y-3 group">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{goal.goal_type}</p>
                          <p className="font-bold text-white group-hover:text-blue-400 transition-colors">Target: ₹{goal.target_amount.toLocaleString()}</p>
                        </div>
                        <p className="text-xs font-black text-slate-500">{Math.round(goal.progress_percentage)}%</p>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all duration-1000"
                          style={{ width: `${goal.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Daily Gainer */}
              <div className="glass-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Top Daily Gainer
                </h3>
                <div>
                  {topGainers.length > 0 ? (
                    topGainers.map((inv) => (
                      <div key={inv.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-green-500/30 transition-all group">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white group-hover:text-green-400 transition-colors uppercase tracking-tight">{inv.symbol}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{inv.asset_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-green-500">+{Number(inv.daily_change).toFixed(2)}%</p>
                            <p className="text-[10px] font-bold text-slate-500">₹{Number(inv.last_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-sm italic py-4 text-center">No gainers today</p>
                  )}
                </div>
              </div>

              {/* Top Daily Loser */}
              <div className="glass-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  Top Daily Loser
                </h3>
                <div>
                  {topLosers.length > 0 ? (
                    topLosers.map((inv) => (
                      <div key={inv.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all group">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-bold text-white group-hover:text-red-400 transition-colors uppercase tracking-tight">{inv.symbol}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{inv.asset_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-red-500">{Number(inv.daily_change).toFixed(2)}%</p>
                            <p className="text-[10px] font-bold text-slate-500">₹{Number(inv.last_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 text-sm italic py-4 text-center">No losers today</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
