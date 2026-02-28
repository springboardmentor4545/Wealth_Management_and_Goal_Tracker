import React, { useEffect, useState } from 'react'
import api from '../lib/api'
// Recharts imports for graph generation - Added AreaChart and Area
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { 
  User, 
  ShieldCheck, 
  TrendingUp, 
  Target, 
  LogOut, 
  ChevronRight, 
  Activity, 
  LayoutDashboard,
  PieChart,
  Settings,
  HelpCircle,
  Plus,
  Minus,
  // ADDED: Icons for the Rebalance Card
  RefreshCw, 
  ArrowRight, 
  TrendingDown
} from 'lucide-react'

export default function Profile({ token, onLogout, onRiskClick, onGoalsClick, onPortfolioClick, onSimulationsClick }){
  const [user, setUser] = useState(null)
  const [err, setErr] = useState(null)
  const [openFaqs, setOpenFaqs] = useState([]) 
  // State for dashboard data and loading
  const [dashData, setDashData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if(!token) return setErr('Not logged in')
    
    // Fetching both user profile and dashboard summary
    Promise.all([
        api.me(token),
        api.getDashboardSummary(token)
    ]).then(([userRes, dashRes]) => {
        if(userRes.status === 200) setUser(userRes.body)
        else setErr(JSON.stringify(userRes.body))
        
        if(dashRes.status === 200) setDashData(dashRes.body)
        setLoading(false)
    }).catch(e => {
        setErr(String(e))
        setLoading(false)
    })
  },[token])

  const faqs = [
    {
      q: "How is my risk profile calculated?",
      a: "Your risk tier (Conservative to Aggressive) is determined by analyzing your investment horizon, financial stability, and comfort with market volatility through our 7-step questionnaire."
    },
    {
      q: "How often are market prices updated?",
      a: "Prices are updated every time you view your portfolio to give you live data. Additionally, our system runs a deep background sync every night at 12:00 AM to ensure historical accuracy."
    },
    {
      q: "What are 'What-If' simulations?",
      a: "These are projection tools that use mathematical models to show how your wealth might grow. You can adjust returns, monthly savings, and time horizons to see if you'll hit your target goals."
    },
    {
      q: "Can I manage multiple wealth goals?",
      a: "Yes! In the Goals section, you can create separate targets for things like retirement, a new home, or education, and track progress for each individually."
    },
    {
      q: "Is my financial data secure?",
      a: "We use industry-standard JWT authentication and secure database encryption. Your real portfolio data is never modified by simulations or external market syncs."
    }
  ]

  const toggleFaq = (idx) => {
    if (openFaqs.includes(idx)) {
        setOpenFaqs(openFaqs.filter(i => i !== idx))
    } else {
        setOpenFaqs([...openFaqs, idx])
    }
  }

  if(!token) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full">
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-bold mb-6">Not logged in</div>
        <button onClick={onLogout} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Go to Login</button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-slate-400 font-medium animate-pulse">Loading Workspace...</span>
        </div>
    </div>
  )

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-900">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent hidden sm:block">
                WealthManager
            </h1>
          </div>
          
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

          <div className="flex items-center gap-2">
             <button 
                onClick={onRiskClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all
                ${user?.profile_completed 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100' 
                    : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 animate-pulse'}`}
             >
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.profile_completed ? user.risk_category : 'Complete Risk Profile'}
             </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-1">
                <NavButton label="Goals" onClick={onGoalsClick} icon={<Target className="w-4 h-4" />} color="hover:text-amber-600" />
                <NavButton label="Portfolio" onClick={onPortfolioClick} icon={<PieChart className="w-4 h-4" />} color="hover:text-indigo-600" />
            </div>
            <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <button 
                onClick={()=>{ localStorage.removeItem('access_token'); onLogout && onLogout() }}
                className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50"
                title="Logout"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {err && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <Activity className="w-5 h-5" />
            <span className="font-medium text-sm">{err}</span>
          </div>
        )}
        
        {/* Compact Welcome Banner - Height Reduced */}
        <div className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden mb-12 group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                      <Activity className="w-3 h-3 animate-pulse" />
                      Live Financial Dashboard
                   </div>
                   <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                        Welcome back, {user?.username || 'Investor'}
                   </h2>
                   <p className="text-slate-400 mt-2 text-base font-medium leading-relaxed max-w-md">
                        {user?.profile_completed 
                            ? `Strategy: ${user.risk_category} growth model.`
                            : "Define your risk appetite to unlock strategies."
                        }
                   </p>
                </div>
                
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <button onClick={onPortfolioClick} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        Go to Portfolio
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* Restored Status and KYC Badges */}
                    <div className="flex gap-3">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center flex-1">
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Status</div>
                            <div className="text-emerald-600 font-black text-xs uppercase">Active</div>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center flex-1">
                            <div className="text-[9px] font-bold text-slate-400 uppercase">KYC</div>
                            <div className="text-slate-700 font-black text-xs uppercase">
                                {user?.kyc_status || 'Verified'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-50 opacity-40 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-violet-50 opacity-40 rounded-full blur-3xl"></div>
        </div>

        {/* --- GRAPH SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            
            {/* 1. Strategy Alignment Graph */}
            <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    Strategy Alignment (%)
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashData?.allocation} layout="vertical">
                            <XAxis type="number" hide domain={[0, 100]} />
                            <YAxis dataKey="asset" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} />
                            <Legend verticalAlign="top" align="right" />
                            <Bar dataKey="actual" fill="#4f46e5" name="Your Portfolio" radius={[0, 6, 6, 0]} barSize={20} />
                            <Bar dataKey="target" fill="#e2e8f0" name="Target Strategy" radius={[0, 6, 6, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Goal Progress Graph */}
            <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" />
                    Goal Milestones
                </h3>
                <div className="space-y-6">
                    {dashData?.goals.map((g, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-600">{g.name}</span>
                                <span className="text-indigo-600">{Math.round(g.pct)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000" 
                                    style={{width: `${g.pct}%`}} 
                                />
                            </div>
                        </div>
                    ))}
                    {dashData?.goals.length === 0 && <p className="text-slate-400 text-sm text-center py-10">No goals active.</p>}
                </div>
            </div>

            {/* ADDED: Rebalance Suggestions Card */}
            <div className="lg:col-span-12">
                <RebalanceCard token={token} />
            </div>

            {/* 3. Wealth Creation Area Chart */}
            <div className="lg:col-span-12 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    Wealth Creation (Invested vs. Market Value)
                </h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashData?.wealth_history}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip />
                            <Legend verticalAlign="top" align="right" />
                            <Area 
                                type="monotone" 
                                dataKey="invested" 
                                stroke="#94a3b8" 
                                fill="#f1f5f9" 
                                name="Invested Capital" 
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#4f46e5" 
                                fill="url(#colorValue)" 
                                name="Current Market Value" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-8">
            <RowCard 
                title="Scenario Analysis Engine" 
                description="Backtest your investment goals against market variables."
                icon={<TrendingUp className="w-6 h-6 text-violet-500" />}
                action={onSimulationsClick}
                actionLabel="Run Projection"
                bg="bg-white"
            >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm"><Activity className="w-5 h-5 text-indigo-600" /></div>
                        <div>
                            <div className="text-xs font-bold text-slate-800">What-If Tools</div>
                            <div className="text-[10px] text-slate-400">Stress test your portfolio history</div>
                        </div>
                    </div>
                 </div>
            </RowCard>
        </div>
      </div>
    </div>
  )
}

function NavButton({ label, onClick, icon, color }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 text-xs font-bold text-slate-500 ${color} transition-all px-3 py-2 rounded-xl hover:bg-slate-50`}
        >
            {icon}
            {label}
        </button>
    )
}

function RowCard({ title, description, icon, action, actionLabel, children, bg }) {
    return (
        <div className={`${bg} rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">{icon}</div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                        <p className="text-sm text-slate-400 font-medium">{description}</p>
                    </div>
                </div>
                <button 
                    onClick={action}
                    className="group bg-slate-50 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center gap-2 border border-slate-100"
                >
                    {actionLabel}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            {children}
        </div>
    )
}

// ADDED: The Rebalance Card Component
// ADDED: The Rebalance Card Component with Specific Top Picks
function RebalanceCard({ token }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token && api.getRebalanceSuggestions) {
            api.getRebalanceSuggestions(token).then(res => {
                if (res.status === 200) setData(res.body);
                setLoading(false);
            }).catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse bg-white rounded-[2rem] border border-slate-100">Analyzing portfolio drift...</div>;
    
    if (data?.status === "error") return null; 
    if (!data?.suggestions || data.suggestions.length === 0) {
        return (
            <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <RefreshCw className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">Perfectly Balanced</h3>
                <p className="text-emerald-600 text-sm mt-1">Your portfolio is exactly aligned with your target strategy. No action needed.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-black text-slate-800 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-indigo-600" />
                        Robo-Advisor Recommendations
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Specific assets to buy/sell to realign with your strategy.</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.suggestions.map((sug, idx) => (
                    <div key={idx} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                        sug.action === 'SELL' 
                        ? 'bg-rose-50/50 border-rose-100' 
                        : 'bg-emerald-50/50 border-emerald-100'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${sug.action === 'SELL' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {sug.action === 'SELL' ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${sug.action === 'SELL' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'}`}>
                                            {sug.action}
                                        </span>
                                        <span className="font-bold text-slate-800">{sug.asset}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                                        Currently {sug.current_pct}% <ArrowRight className="w-3 h-3" /> Target {sug.target_pct}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-black text-xl ${sug.action === 'SELL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    ${sug.amount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Specific Asset Recommendations for BUY orders */}
                        {sug.action === 'BUY' && sug.top_picks && sug.top_picks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-emerald-100/60">
                                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 block">
                                    Suggested {sug.asset} to buy:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {sug.top_picks.map((pick, pIdx) => (
                                        <div key={pIdx} className="bg-white border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                            <span className="font-black text-xs text-slate-800">{pick.symbol}</span>
                                            <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{pick.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}