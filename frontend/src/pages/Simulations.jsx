import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Navbar from "../components/Navbar";

export default function Simulations() {
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        scenario_name: "",
        goal_id: null,
        assumptions: {
            initial_amount: 100000,
            monthly_contribution: 10000,
            expected_return: 12,
            inflation: 6,
            time_horizon: 10,
            target_amount: 5000000
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const headers = { Authorization: `Bearer ${token}` };

            const [simRes, goalRes] = await Promise.all([
                axios.get("http://127.0.0.1:8000/api/v1/simulations", { headers }),
                axios.get("http://127.0.0.1:8000/api/v1/goals", { headers })
            ]);

            setSimulations(simRes.data);
            setGoals(goalRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Simulation fetch error:", err);
            toast.error("Failed to load simulations");
            setLoading(false);
        }
    };

    const handleCreateSimulation = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            const headers = { Authorization: `Bearer ${token}` };

            const response = await axios.post(
                "http://127.0.0.1:8000/api/v1/simulations",
                formData,
                { headers }
            );

            toast.success("Simulation created successfully!");
            setSimulations([response.data, ...simulations]);
            setShowForm(false);
            setFormData({
                scenario_name: "",
                goal_id: null,
                assumptions: {
                    initial_amount: 100000,
                    monthly_contribution: 10000,
                    expected_return: 12,
                    inflation: 6,
                    time_horizon: 10,
                    target_amount: 5000000
                }
            });
        } catch (err) {
            console.error("Simulation creation error:", err);
            toast.error("Failed to create simulation");
        }
    };

    const currentProjectionData = useMemo(() => {
        const { initial_amount, monthly_contribution, expected_return, time_horizon } = formData.assumptions;
        const data = [];

        // Calculate year by year using the simplified formula logic
        // Year 0
        data.push({
            year: 'Start',
            balance: initial_amount,
            invested: initial_amount
        });

        for (let year = 1; year <= time_horizon; year++) {
            // Total Invested at year N = Initial + (Monthly * 12 * N)
            const total_invested = initial_amount + (monthly_contribution * 12 * year);

            // Future Value at year N = Total Invested * (1 + Return%)
            // Note: The user provided a static multiplier formula for the end result. 
            // Applied incrementally to show "growth over years":
            const balance = total_invested * (1 + (expected_return / 100));

            data.push({
                year: `Year ${year}`,
                balance: Math.round(balance),
                invested: Math.round(total_invested)
            });
        }
        return data;
    }, [formData.assumptions]);

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08)_0%,transparent_50%)]"></div>

            <div className="relative max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
                <Navbar />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">Wealth Analysis</h2>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            Simulations & <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">What-If</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        {showForm ? "Cancel" : "New Simulation"}
                    </button>
                </header>

                {showForm && (
                    <div className="grid lg:grid-cols-2 gap-8 animate-in slide-in-from-top duration-500">
                        <div className="glass-card p-8 space-y-8">
                            <h3 className="text-xl font-black tracking-tight">Assumption Parameters</h3>
                            <form onSubmit={handleCreateSimulation} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Scenario Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.scenario_name}
                                        onChange={(e) => setFormData({ ...formData, scenario_name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="e.g., Retirement Plan B"
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Initial Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.initial_amount}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, initial_amount: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Monthly Contribution (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.monthly_contribution}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, monthly_contribution: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Exp. Return (%)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.expected_return}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, expected_return: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Time Horizon (Years)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.time_horizon}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, time_horizon: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Inflation (%)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.inflation}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, inflation: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Target Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.assumptions.target_amount}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                assumptions: { ...formData.assumptions, target_amount: Number(e.target.value) }
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-bold uppercase tracking-widest text-xs hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg"
                                >
                                    Save & Run Simulation
                                </button>
                            </form>
                        </div>

                        <div className="glass-card p-8 flex flex-col h-full">
                            <h3 className="text-xl font-black tracking-tight mb-8 text-blue-400">Projected Growth</h3>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={currentProjectionData}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                        <XAxis dataKey="year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                        <YAxis
                                            stroke="#94a3b8"
                                            fontSize={10}
                                            tickLine={false}
                                            tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                            formatter={(val, name) => [
                                                `₹${val.toLocaleString()}`,
                                                name === 'balance' ? 'Future Value' : 'Total Invested'
                                            ]}
                                        />
                                        <Area type="monotone" dataKey="invested" stackId="2" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorInvested)" name="invested" />
                                        <Area type="monotone" dataKey="balance" stackId="1" stroke="#3b82f6" strokeWidth={3} fill="url(#colorBalance)" name="balance" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    <h3 className="text-xl font-black tracking-tight px-4">Saved Scenarios</h3>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : simulations.length === 0 ? (
                        <div className="glass-card p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                            No simulations saved yet. Start by creating one above.
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {simulations.map((sim) => (
                                <div key={sim.id} className="glass-card p-6 hover:border-blue-500/30 transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-lg font-black tracking-tight uppercase group-hover:text-blue-400 transition-colors">{sim.scenario_name}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                                                {new Date(sim.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                            {sim.assumptions.time_horizon} Years
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Future Value</span>
                                            <span className="font-black">₹{sim.results.future_value?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 font-bold uppercase tracking-widest">Real Value (Inf. Adj)</span>
                                            <span className="font-black text-blue-400">₹{sim.results.future_value_real?.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Target</p>
                                            <p className="text-sm font-black text-white">₹{sim.assumptions.target_amount?.toLocaleString() || "N/A"}</p>
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Gap</p>
                                            <p className={`text-sm font-black ${sim.results.shortfall_or_surplus > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {sim.results.shortfall_or_surplus > 0 ? '+' : ''}₹{sim.results.shortfall_or_surplus?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
