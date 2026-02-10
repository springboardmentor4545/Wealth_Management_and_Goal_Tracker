import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Plus, Trash2, Calculator, Info, Target, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Simulations({ token, onBack }) {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('My Financial Future');
  const [currentBalance, setCurrentBalance] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [years, setYears] = useState(15);
  const [targetAmount, setTargetAmount] = useState(500000);
  
  useEffect(() => {
    loadSimulations();
  }, [token]);

  const loadSimulations = async () => {
    setLoading(true);
    const res = await api.getSimulations(token);
    if (res.status === 200) setSimulations(res.body);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      title,
      assumptions: {
        current_balance: parseFloat(currentBalance),
        monthly_contribution: parseFloat(monthlyContribution),
        annual_return: parseFloat(annualReturn),
        years: parseInt(years),
        target_amount: parseFloat(targetAmount)
      }
    };

    const res = await api.createSimulation(payload, token);
    if (res.status === 200) {
      setShowForm(false);
      loadSimulations();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this simulation?")) {
      const res = await api.deleteSimulation(id, token);
      if (res.status === 200) loadSimulations();
    }
  };

  const generateChartData = (sim) => {
    const data = [];
    let balance = parseFloat(sim.assumptions.current_balance);
    const monthly = parseFloat(sim.assumptions.monthly_contribution);
    const rate = parseFloat(sim.assumptions.annual_return) / 100 / 12;
    const years = parseInt(sim.assumptions.years);
    const target = parseFloat(sim.assumptions.target_amount || 0);
    
    for (let i = 0; i <= years; i++) {
        data.push({
            year: i,
            value: Math.round(balance),
            invested: Math.round(parseFloat(sim.assumptions.current_balance) + (monthly * 12 * i)),
            target: target > 0 ? target : null
        });
        
        for(let m=0; m<12; m++) {
            balance = (balance + monthly) * (1 + rate);
        }
    }
    return data;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-900">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-all"
          >
            <span className="bg-slate-100 group-hover:bg-indigo-50 p-2 rounded-full transition-colors">
                <ArrowDownRight className="w-4 h-4 rotate-135" />
            </span>
            Back
          </button>
          <div className="h-6 w-[1px] bg-slate-200"></div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            What-If Engine
          </h1>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`
            px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]
            ${showForm 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-200'}
          `}
        >
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> New scenario</>}
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* Intro Section */}
        {!showForm && simulations.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="inline-flex p-4 bg-indigo-50 rounded-2xl mb-4">
                    <Calculator className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">No Simulations Yet</h2>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Create your first simulation to project how your wealth could grow based on different savings goals and market returns.
                </p>
                <button 
                    onClick={() => setShowForm(true)}
                    className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mx-auto"
                >
                    <Plus className="w-5 h-5" /> Start Projecting
                </button>
            </div>
        )}

        {/* Premium Input Form */}
        {showForm && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 p-10 mb-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-1 bg-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800">New Simulation Assumptions</h2>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Scenario Title</label>
                  <input required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Dream Retirement" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Capital ($)</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" value={currentBalance} onChange={e=>setCurrentBalance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Contribution ($)</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" value={monthlyContribution} onChange={e=>setMonthlyContribution(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Avg. Annual Return (%)</label>
                  <input required type="number" step="0.1" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" value={annualReturn} onChange={e=>setAnnualReturn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Yearly Horizon</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all" value={years} onChange={e=>setYears(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Wealth Goal ($)</label>
                  <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all" value={targetAmount} onChange={e=>setTargetAmount(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                    <Info className="w-4 h-4" />
                    Simulations use compound interest formulas and do not account for taxes or fees.
                </div>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1">
                  Generate Projection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List of Scenarios */}
        <div className="space-y-12">
          {simulations.map((sim) => {
            const hasTarget = sim.results.target_amount > 0;
            const metGoal = sim.results.goal_met;
            const diff = sim.results.shortfall_surplus;

            return (
              <div key={sim.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group animate-in slide-in-from-bottom-6 duration-700">
                {/* Scenario Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      {sim.title}
                      {hasTarget && (
                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md tracking-tighter ${metGoal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {metGoal ? 'Goal Met' : 'Shortfall'}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2">
                        <AssumptionBadge label="Starting" value={`$${Math.round(sim.assumptions.current_balance).toLocaleString()}`} />
                        <AssumptionBadge label="Monthly" value={`$${Math.round(sim.assumptions.monthly_contribution).toLocaleString()}`} />
                        <AssumptionBadge label="Return" value={`${sim.assumptions.annual_return}%`} />
                        <AssumptionBadge label="Horizon" value={`${sim.assumptions.years}Y`} />
                    </div>
                  </div>
                  <button onClick={() => handleDelete(sim.id)} className="text-slate-200 hover:text-rose-500 p-2 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Results Sidebar */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-indigo-600 rounded-[1.5rem] p-7 text-white shadow-lg shadow-indigo-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Projected Net Worth</span>
                            <div className="text-4xl font-extrabold mt-1 tracking-tight">${sim.results.future_value.toLocaleString()}</div>
                            <div className="mt-4 pt-4 border-t border-indigo-500/50 flex justify-between items-center">
                                <span className="text-indigo-200 text-xs">Returns Earned</span>
                                <span className="font-bold text-sm text-indigo-50 flex items-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" />
                                    ${sim.results.estimated_profit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        {/* Abstract Background Shape */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    </div>
                    
                    {hasTarget && (
                        <div className={`rounded-3xl p-6 border-2 flex flex-col items-center text-center ${metGoal ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className={`p-3 rounded-full mb-3 ${metGoal ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {metGoal ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                            </div>
                            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">vs Target of ${sim.results.target_amount.toLocaleString()}</span>
                            <div className={`text-xl font-black mt-1 ${metGoal ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {metGoal ? '+' : ''}${Math.abs(diff).toLocaleString()} {metGoal ? 'Surplus' : 'Shortfall'}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                                {metGoal 
                                    ? "Excellent! You are on track to exceed your goal. Consider reducing risk or retiring earlier." 
                                    : "You're slightly behind. Try increasing monthly savings or extending your time horizon."}
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
                        <span className="text-slate-500 text-xs">Total Contributions</span>
                        <span className="text-slate-700 font-bold text-sm">${sim.results.total_invested.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* High Resolution Chart */}
                  <div className="lg:col-span-8 h-[380px] bg-slate-50/30 rounded-3xl p-4 border border-slate-50">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(sim)} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="year" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
                                label={{ value: 'Years Out', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#94a3b8' }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}}
                                tickFormatter={(val) => `$${val >= 1000000 ? (val/1000000).toFixed(1) + 'M' : (val/1000).toFixed(0) + 'k'}`}
                            />
                            <Tooltip 
                                content={<CustomTooltip />}
                                cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '5 5' }}
                            />
                            {/* Target Line */}
                            {hasTarget && (
                              <Line type="monotone" dataKey="target" stroke="#f43f5e" strokeWidth={1} strokeDasharray="4 4" dot={false} activeDot={false} />
                            )}
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#4f46e5" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                                animationDuration={2000}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="invested" 
                                stroke="#cbd5e1" 
                                strokeWidth={2} 
                                strokeDasharray="6 6" 
                                fill="none" 
                                animationDuration={2500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-medium italic">Simulating market cycles...</span>
            </div>
        )}
      </div>
    </div>
  );
}

function AssumptionBadge({ label, value }) {
    return (
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}:</span>
            <span className="text-xs font-bold text-slate-700">{value}</span>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 outline-none">
        <p className="text-xs font-black text-slate-400 mb-2 uppercase">End of Year {label}</p>
        <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
                <span className="text-[11px] font-medium text-slate-500">Proj. Wealth</span>
                <span className="text-sm font-black text-indigo-600">${payload.find(p => p.dataKey === 'value')?.value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center gap-6">
                <span className="text-[11px] font-medium text-slate-500">Total Invested</span>
                <span className="text-sm font-bold text-slate-400">${payload.find(p => p.dataKey === 'invested')?.value.toLocaleString()}</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};
