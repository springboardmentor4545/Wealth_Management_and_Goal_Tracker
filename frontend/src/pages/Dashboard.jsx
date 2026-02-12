import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const name = localStorage.getItem("name") || "User";
  const [stats, setStats] = useState({
    investments: [],
    goals: [],
    loading: true,
    isRefreshing: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, goalRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/v1/portfolio/investments", { headers }),
        axios.get("http://127.0.0.1:8000/api/v1/goals", { headers })
      ]);

      setStats({
        investments: invRes.data,
        goals: goalRes.data,
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

      toast.success("Prices updated! Refetching data...");

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
      acc[type] = (acc[type] || 0) + Number(inv.current_value || 0);
      return acc;
    }, {});

    return Object.entries(allocation)
      .filter(([_, value]) => Number(value) > 0)
      .map(([name, value]) => ({ name: name.toUpperCase(), value: Number(value) }));
  }, [stats.investments]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const topGainers = useMemo(() => {
    return stats.investments
      .filter(inv => inv.daily_change && Number(inv.daily_change) > 0)
      .sort((a, b) => Number(b.daily_change) - Number(a.daily_change))
      .slice(0, 1);
  }, [stats.investments]);

  const topLosers = useMemo(() => {
    return stats.investments
      .filter(inv => inv.daily_change && Number(inv.daily_change) < 0)
      .sort((a, b) => Number(a.daily_change) - Number(b.daily_change))
      .slice(0, 1);
  }, [stats.investments]);


  return (
    <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08)_0%,transparent_50%)]"></div>

      <div className="relative max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        <Navbar />

        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">Dashboard</h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{name}</span>
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-8 group hover:border-blue-500/30 transition-all">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">Total Net Worth</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    ₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
                    <span>{stats.investments.length} Active Assets</span>
                  </div>
                </div>

                <div className="glass-card p-8 group hover:border-purple-500/30 transition-all">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">Goal Progress</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {stats.goals.length} <span className="text-xl text-slate-500 font-bold uppercase ml-1">Active Goals</span>
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
                    <span>Track your progress</span>
                  </div>
                </div>
              </div>


              {/* Top Gainers and Losers */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top Gainers */}
                <div className="glass-card p-8">
                  <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Top Daily Gainers
                  </h3>
                  <div className="space-y-4">
                    {topGainers.length > 0 ? (
                      topGainers.map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-green-500/30 transition-all group">
                          <div>
                            <p className="font-bold text-white group-hover:text-green-400 transition-colors">{inv.symbol}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{inv.asset_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-green-500">+{Number(inv.daily_change).toFixed(2)}%</p>
                            <p className="text-xs text-slate-500">₹{Number(inv.last_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-sm text-center py-8 italic">No gainers today</p>
                    )}
                  </div>
                </div>

                {/* Top Losers */}
                <div className="glass-card p-8">
                  <h3 className="text-lg font-black tracking-tight mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    Top Daily Losers
                  </h3>
                  <div className="space-y-4">
                    {topLosers.length > 0 ? (
                      topLosers.map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/30 transition-all group">
                          <div>
                            <p className="font-bold text-white group-hover:text-red-400 transition-colors">{inv.symbol}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{inv.asset_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-black text-red-500">{Number(inv.daily_change).toFixed(2)}%</p>
                            <p className="text-xs text-slate-500">₹{Number(inv.last_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 text-sm text-center py-8 italic">No losers today</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset Allocation Chart */}
              <div className="md:col-span-2 glass-card p-8 min-h-[400px] flex flex-col">
                <h3 className="text-lg font-black tracking-tight mb-8">Asset Allocation</h3>
                <div className="flex-1 w-full flex items-center justify-center min-h-[350px]">
                  {portfolioData.length > 0 ? (
                    <PieChart width={400} height={350}>
                      <Pie
                        data={portfolioData}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cx="50%"
                        cy="50%"
                        isAnimationActive={false}
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-600 font-bold uppercase tracking-widest text-xs">
                      No data available
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-6 mt-6">
                  {portfolioData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Goals List Sidebar */}
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
                        className="h-full bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-1000"
                        style={{ width: `${goal.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
