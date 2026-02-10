import React, { useEffect, useState } from 'react'
import api from '../lib/api'
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
  Minus
} from 'lucide-react'

export default function Profile({ token, onLogout, onRiskClick, onGoalsClick, onPortfolioClick, onSimulationsClick }){
  const [user, setUser] = useState(null)
  const [err, setErr] = useState(null)
  const [openFaqs, setOpenFaqs] = useState([]) // Array to track multiple open FAQs

  useEffect(()=>{
    if(!token) return setErr('Not logged in')
    api.me(token).then(r=>{
      if(r.status===200) setUser(r.body)
      else setErr(JSON.stringify(r.body))
    }).catch(e=>setErr(String(e)))
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

  if (!user && !err) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-slate-400 font-medium animate-pulse">Loading Workspace...</span>
        </div>
    </div>
  )

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-900">
      
      {/* Dynamic Navigation Bar */}
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

          {/* Risk Badge in Nav */}
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
                <NavButton label="Backtest" onClick={onSimulationsClick} icon={<TrendingUp className="w-4 h-4" />} color="hover:text-violet-600" />
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

      <div className="max-w-5xl mx-auto px-6 mt-10">
        {err && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <Activity className="w-5 h-5" />
            <span className="font-medium text-sm">{err}</span>
          </div>
        )}
        
        {/* Modern Welcome Banner */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-100/50 border border-slate-100 relative overflow-hidden mb-12 group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                   <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      Live Financial Dashboard
                   </div>
                   <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                        Welcome back,<br/>
                        {user?.username || 'Investor'}
                   </h2>
                   <p className="text-slate-400 mt-4 text-lg font-medium leading-relaxed max-w-md">
                        {user?.profile_completed 
                            ? `Your strategy is currently aligned with an ${user.risk_category} growth model.`
                            : "Define your risk appetite to unlock personalized investment strategies."
                        }
                   </p>
                </div>
                
                <div className="flex flex-col gap-3 w-full md:w-auto">
                    <button onClick={onPortfolioClick} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:-translate-y-1">
                        Go to Portfolio
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="flex gap-3">
                        <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 text-center flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Status</div>
                            <div className="text-emerald-600 font-black text-sm uppercase">Active</div>
                        </div>
                        <div className="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 text-center flex-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">KYC</div>
                            <div className="text-slate-700 font-black text-sm uppercase">{user?.kyc_status}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-50 opacity-40 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -top-20 w-64 h-64 bg-violet-50 opacity-40 rounded-full blur-3xl"></div>
        </div>

        {/* Row-wise Full Width Cards */}
        <div className="space-y-8">
            
            {/* Simulations Row */}
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
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm"><Target className="w-5 h-5 text-indigo-600" /></div>
                        <div>
                            <div className="text-xs font-bold text-slate-800">Goal Tracking</div>
                            <div className="text-[10px] text-slate-400">Path to reaching your target wealth</div>
                        </div>
                    </div>
                 </div>
            </RowCard>

            {/* FAQ SECTION - COLLAPSED BY DEFAULT */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all duration-500">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
                        <HelpCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Financial FAQ</h3>
                        <p className="text-sm text-slate-400 font-medium">Quick answers — Click to expand any topic.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaqs.includes(idx);
                        return (
                            <div key={idx} className={`border rounded-2xl transition-all duration-300 ${isOpen ? 'border-amber-200 bg-amber-50/20' : 'border-slate-50 hover:border-slate-200'}`}>
                                <button 
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex justify-between items-center p-5 text-left"
                                >
                                    <span className={`font-bold text-sm ${isOpen ? 'text-amber-700' : 'text-slate-700'}`}>{faq.q}</span>
                                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : 'text-slate-300'}`}>
                                        {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </div>
                                </button>
                                {isOpen && (
                                    <div className="p-5 pt-0 text-slate-500 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="h-px bg-slate-100 mb-4"></div>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Account Settings / Meta */}
            <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1 bg-slate-900 rounded-[2rem] p-8 text-white flex justify-between items-center group overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Configuration</div>
                        <h3 className="text-xl font-bold">Account Settings</h3>
                        <p className="text-slate-500 text-xs mt-1">Manage KYC and Preferences</p>
                    </div>
                    <button className="relative z-10 bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                        <Settings className="w-6 h-6 text-white" />
                    </button>
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 opacity-20 rounded-full blur-[60px]"></div>
                 </div>
            </div>

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
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {icon}
                    </div>
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
