import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Navbar from "../components/Navbar";

export default function Recommendations() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.get("http://127.0.0.1:8000/api/v1/recommendations/status", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
            toast.error("Failed to load recommendations");
        } finally {
            setLoading(false);
        }
    };

    const chartData_current = useMemo(() => {
        if (!data) return [];
        return Object.entries(data.current_allocation).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        })).filter(item => item.value > 0);
    }, [data]);

    const chartData_target = useMemo(() => {
        if (!data) return [];
        return Object.entries(data.target_allocation).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));
    }, [data]);

    const COLORS = ["#3b82f6", "#6366f1", "#06b6d4"];

    const risk_p = data?.risk_profile?.toLowerCase();
    const riskColor = risk_p === "conservative" ? "emerald" : risk_p === "aggressive" ? "rose" : "amber";

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
            <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(${riskColor === 'emerald' ? '16,185,129' : riskColor === 'rose' ? '244,63,94' : '245,158,11'},0.08)_0%,transparent_50%)]`}></div>
            <div className={`absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(${riskColor === 'emerald' ? '16,185,129' : riskColor === 'rose' ? '244,63,129' : '245,158,11'},0.08)_0%,transparent_50%)]`}></div>

            <div className="relative max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
                <Navbar />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">Asset Strategy</h2>
                        <h1 className="text-5xl font-black tracking-tight">Recommendations</h1>
                        <p className="text-slate-400 font-medium">Risk-based rebalancing advice for your portfolio.</p>
                    </div>
                    <div className={`glass-card px-6 py-3 border-${riskColor}-500/10 flex items-center gap-3`}>
                        <div className={`w-2 h-2 rounded-full bg-${riskColor}-500 animate-pulse`}></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest text-${riskColor}-500`}>
                            {data?.risk_profile || "Moderate"} Profile
                        </span>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Allocation Comparison */}
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Current Allocation */}
                                <div className="glass-card p-8 flex flex-col h-[400px]">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-8">Current Mix</h3>
                                    <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                                        {chartData_current.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={chartData_current} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                        {chartData_current.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">No Current Data</div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                                        {chartData_current.map((entry, index) => (
                                            <div key={index} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span>{entry.name} {entry.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Allocation */}
                                <div className="glass-card p-8 flex flex-col h-[400px] border-indigo-500/20">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-8">Target Mix</h3>
                                    <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                                        {chartData_target.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie data={chartData_target} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" opacity={0.6}>
                                                        {chartData_target.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">No Target Data</div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                                        {chartData_target.map((entry, index) => (
                                            <div key={index} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                <span>{entry.name} {entry.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Stats */}
                            <div className="glass-card p-8 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Portfolio Value</p>
                                    <p className="text-3xl font-black text-white">₹{data?.total_value?.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${data?.suggestions.some(s => s.action !== "Maintain")
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        }`}>
                                        {data?.suggestions.some(s => s.action !== "Maintain") ? "Action Required" : "Balanced"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Rebalancing Suggestions */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-black tracking-tight px-2 flex items-center gap-2">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                Rebalancing Advice
                            </h3>
                            <div className="space-y-4">
                                {data?.suggestions.map((s, idx) => (
                                    <div key={idx} className={`glass-card p-6 border-white/5 hover:border-white/10 transition-all ${s.action === "Maintain" ? "opacity-60" : "scale-[1.02] border-indigo-500/10"}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.category}</p>
                                                <h4 className="text-xl font-black">{s.action} Position</h4>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.action === "Reduce" ? "bg-rose-500/10 text-rose-500" :
                                                s.action === "Increase" ? "bg-emerald-500/10 text-emerald-500" :
                                                    "bg-slate-500/10 text-slate-500"
                                                }`}>
                                                {s.difference > 0 ? `+${s.difference}%` : `${s.difference}%`}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed">{s.message}</p>

                                        {/* Progress visual */}
                                        <div className="mt-6 flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${s.current_pct}%` }}></div>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-500">{s.current_pct}% / {s.target_pct}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
