import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Goals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [goalToDelete, setGoalToDelete] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [newGoal, setNewGoal] = useState({
        goal_type: "retirement",
        target_amount: "",
        target_date: "",
        monthly_contribution: "",
    });
    const [editGoal, setEditGoal] = useState({
        goal_type: "",
        target_amount: "",
        target_date: "",
        monthly_contribution: "",
        status: "",
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const res = await axios.get("http://127.0.0.1:8000/api/v1/goals", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setGoals(res.data);
        } catch (err) {
            toast.error("Failed to load goals");
        } finally {
            setLoading(false);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            const payload = {
                ...newGoal,
                target_amount: parseFloat(newGoal.target_amount),
                monthly_contribution: parseFloat(newGoal.monthly_contribution),
            };

            await axios.post("http://127.0.0.1:8000/api/v1/goals", payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Goal added successfully!");
            setShowAddModal(false);
            fetchGoals();
            setNewGoal({
                goal_type: "retirement",
                target_amount: "",
                target_date: "",
                monthly_contribution: "",
            });
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to add goal";
            toast.error(typeof errorMsg === 'string' ? errorMsg : "Failed to add goal");
        }
    };

    const openEditModal = (goal) => {
        setSelectedGoal(goal);
        setEditGoal({
            goal_type: goal.goal_type,
            target_amount: goal.target_amount,
            target_date: goal.target_date,
            monthly_contribution: goal.monthly_contribution,
            status: goal.status,
        });
        setShowEditModal(true);
    };

    const handleUpdateGoal = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("access_token");
            const payload = {
                ...editGoal,
                target_amount: parseFloat(editGoal.target_amount),
                monthly_contribution: parseFloat(editGoal.monthly_contribution),
            };

            await axios.put(`http://127.0.0.1:8000/api/v1/goals/${selectedGoal.id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Goal updated successfully!");
            setShowEditModal(false);
            fetchGoals();
        } catch (err) {
            toast.error("Failed to update goal");
        }
    };

    const confirmDelete = async () => {
        if (!goalToDelete) return;
        try {
            const token = localStorage.getItem("access_token");
            await axios.delete(`http://127.0.0.1:8000/api/v1/goals/${goalToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Goal deleted successfully");
            setShowDeleteModal(false);
            setGoalToDelete(null);
            fetchGoals();
        } catch (err) {
            toast.error("Failed to delete goal");
        }
    };

    const deleteGoal = (id) => {
        setGoalToDelete(id);
        setShowDeleteModal(true);
    };

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-10 relative font-sans text-white overflow-x-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05)_0%,transparent_50%)]"></div>

            <div className="relative max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                <Navbar />

                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-2">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-purple-500">My Targets</h2>
                        <h1 className="text-5xl font-black tracking-tight">Financial Goals</h1>
                        <p className="text-slate-400 font-medium">Plan and track your future aspirations.</p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                    >
                        <span>+</span> Add Goal
                    </button>
                </header>

                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                        </div>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="glass-card p-32 border-white/5 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">No Goals Found</h3>
                            <p className="text-slate-500 font-medium italic">"A goal without a plan is just a wish."</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {goals.map((goal) => (
                            <div key={goal.id} className="glass-card p-8 border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent space-y-8 relative overflow-hidden group">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-1 block">{goal.goal_type}</span>
                                        <h3 className="text-2xl font-black capitalize tracking-tight">{goal.goal_type} Goal</h3>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(goal)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-blue-600/20 text-slate-500 hover:text-blue-400 transition-all border border-white/5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => deleteGoal(goal.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-600/20 text-slate-500 hover:text-rose-400 transition-all border border-white/5">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount Saved</p>
                                            <p className="text-3xl font-black tracking-tighter tabular-nums">₹{goal.total_invested.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Target</p>
                                            <p className="text-sm font-black text-slate-300 tabular-nums">₹{goal.target_amount.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-1000 relative shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                style={{ width: `${goal.progress_percentage}%` }}
                                            >
                                                <div className="absolute top-0 right-0 w-2 h-full bg-white/30 blur-[2px]"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-slate-500">{goal.progress_percentage.toFixed(1)}% Reached</span>
                                            <span className={`${goal.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>{goal.status}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Monthly Goal</p>
                                            <p className="text-xs font-black text-slate-200 tabular-nums">₹{goal.monthly_contribution.toLocaleString('en-IN')}/mo</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Target Date</p>
                                            <p className="text-xs font-black text-slate-200">{new Date(goal.target_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-[-10%] right-[-10%] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none">
                                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Goal Modals */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 tabular-nums">
                    <div className="glass-card bg-[#0f172a] border-white/10 p-10 max-w-xl w-full space-y-8 shadow-2xl relative animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-purple-500 mb-1">Entry</h2>
                                <h3 className="text-3xl font-black tracking-tight">{showAddModal ? "New Goal" : "Edit Goal"}</h3>
                            </div>
                            <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        </div>

                        <form onSubmit={showAddModal ? handleAddGoal : handleUpdateGoal} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Goal Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['retirement', 'home', 'education', 'custom'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => showAddModal ? setNewGoal({ ...newGoal, goal_type: type }) : setEditGoal({ ...editGoal, goal_type: type })}
                                            className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${(showAddModal ? newGoal.goal_type : editGoal.goal_type) === type
                                                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                                                    : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold focus:bg-white/[0.08]"
                                    placeholder="e.g. 5,00,000"
                                    value={showAddModal ? newGoal.target_amount : editGoal.target_amount}
                                    onChange={(e) => showAddModal ? setNewGoal({ ...newGoal, target_amount: e.target.value }) : setEditGoal({ ...editGoal, target_amount: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Monthly Saving (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold focus:bg-white/[0.08]"
                                        placeholder="5,000"
                                        value={showAddModal ? newGoal.monthly_contribution : editGoal.monthly_contribution}
                                        onChange={(e) => showAddModal ? setNewGoal({ ...newGoal, monthly_contribution: e.target.value }) : setEditGoal({ ...editGoal, monthly_contribution: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold focus:bg-white/[0.08]"
                                        value={showAddModal ? newGoal.target_date : editGoal.target_date}
                                        onChange={(e) => showAddModal ? setNewGoal({ ...newGoal, target_date: e.target.value }) : setEditGoal({ ...editGoal, target_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {showEditModal && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Goal Status</label>
                                    <select
                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold cursor-pointer appearance-none"
                                        value={editGoal.status}
                                        onChange={(e) => setEditGoal({ ...editGoal, status: e.target.value })}
                                    >
                                        <option value="active" className="bg-[#0f172a]">Active</option>
                                        <option value="paused" className="bg-[#0f172a]">Paused</option>
                                        <option value="completed" className="bg-[#0f172a]">Completed</option>
                                    </select>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-5 rounded-[1.25rem] text-sm font-black uppercase tracking-[0.2em] text-white transition-all shadow-xl shadow-purple-600/30 mt-6 active:scale-[0.98]">
                                {showAddModal ? "Create Goal" : "Update Goal"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Deletion Confirm */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="glass-card bg-[#0f172a] border-white/10 p-10 max-w-sm w-full space-y-8 text-center shadow-2xl relative animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto border border-rose-600/20 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
                            <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black tracking-tight">Delete Goal?</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase tracking-widest text-[10px]">This action cannot be undone. All progress will be lost.</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 border border-white/5 transition-all">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 bg-rose-600 hover:bg-rose-500 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl shadow-rose-600/30 transition-all active:scale-[0.95]">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
