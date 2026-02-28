import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Target, ChevronLeft, Plus, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export default function Goals({ token, onBack }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch goals when the component mounts
    useEffect(() => {
        setLoading(true);
        api.getGoals(token)
            .then(res => {
                if (res.status === 200) {
                    setGoals(res.body);
                } else {
                    setError("Could not load goals. Please try again.");
                }
            })
            .catch(err => {
                setError("Network error. Is the server running?");
            })
            .finally(() => {
                // This guarantees the loading screen goes away no matter what!
                setLoading(false); 
            });
    }, [token]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <div className="text-slate-400 font-medium animate-pulse">Loading your financial goals...</div>
        </div>
    );

    return (
        <div className="bg-[#f8fafc] min-h-screen pb-24 font-sans text-slate-900">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm">
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        My Goals
                    </h1>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Goal
                </button>
            </nav>

            <div className="max-w-4xl mx-auto px-6 mt-10">
                
                {/* Error Banner */}
                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                )}

                {/* Empty State */}
                {!error && goals.length === 0 && (
                    <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Target className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">No goals set yet</h2>
                        <p className="text-slate-400 mb-6">Create a goal like a "Dream House" or "Retirement" to start tracking your progress.</p>
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                            Create your first goal
                        </button>
                    </div>
                )}

                {/* Goal Cards */}
                <div className="space-y-6">
                    {goals.map((goal, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800">{goal.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {goal.duration_months} months left
                                        </span>
                                        <span className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 text-indigo-600">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            ${goal.required_monthly_investment}/mo needed
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-800">${goal.current_amount?.toLocaleString() || 0}</div>
                                    <div className="text-sm font-bold text-slate-400">of ${goal.target_amount.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* The Progress Bar */}
                            <div className="relative pt-2">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-slate-500">Progress</span>
                                    <span className="text-indigo-600">{goal.progress_percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative" 
                                        style={{ width: `${Math.min(goal.progress_percentage || 0, 100)}%` }}
                                    >
                                        <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}