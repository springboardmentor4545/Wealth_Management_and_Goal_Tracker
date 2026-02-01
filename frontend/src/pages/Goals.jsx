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
            console.error(err);
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
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 relative font-sans text-white">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

            <div className="relative max-w-6xl mx-auto space-y-8">
                <Navbar />

                <div className="flex justify-end">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                    >
                        <span>+</span> Add Goal
                    </button>
                </div>

                <header className="space-y-2">
                    <h1 className="text-3xl font-bold">Your Financial Goals</h1>
                    <p className="text-slate-400">Track and manage your long-term aspirations</p>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md p-20 rounded-3xl border border-white/10 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <p className="text-slate-400">No goals set yet. Start by adding one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map((goal) => (
                            <div key={goal.id} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{goal.goal_type}</span>
                                        <h3 className="text-xl font-bold mt-1 capitalize">{goal.goal_type} Goal</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEditModal(goal)} className="text-slate-500 hover:text-blue-400 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => deleteGoal(goal.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-slate-400 text-xs">Progress</p>
                                            <p className="text-2xl font-bold">${goal.total_invested.toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm font-medium text-slate-400">of ${goal.target_amount.toLocaleString()}</p>
                                    </div>

                                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-blue-500 h-full transition-all duration-1000"
                                            style={{ width: `${goal.progress_percentage}%` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monthly</p>
                                            <p className="text-sm font-bold text-slate-300">${goal.monthly_contribution}</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Target Date</p>
                                            <p className="text-sm font-bold text-slate-300">{new Date(goal.target_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full space-y-6 shadow-2xl relative">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Add New Goal</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleAddGoal} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Goal Type</label>
                                <select
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    value={newGoal.goal_type}
                                    onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                                >
                                    <option value="retirement">Retirement</option>
                                    <option value="home">New Home</option>
                                    <option value="education">Education</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Target Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    placeholder="e.g. 50000"
                                    value={newGoal.target_amount}
                                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Monthly Save ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        placeholder="500"
                                        value={newGoal.monthly_contribution}
                                        onChange={(e) => setNewGoal({ ...newGoal, monthly_contribution: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        value={newGoal.target_date}
                                        onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-600/20 mt-4">
                                Create Goal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full space-y-6 shadow-2xl relative">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Edit Goal</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleUpdateGoal} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Goal Type</label>
                                <select
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    value={editGoal.goal_type}
                                    onChange={(e) => setEditGoal({ ...editGoal, goal_type: e.target.value })}
                                >
                                    <option value="retirement">Retirement</option>
                                    <option value="home">New Home</option>
                                    <option value="education">Education</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Target Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    value={editGoal.target_amount}
                                    onChange={(e) => setEditGoal({ ...editGoal, target_amount: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Monthly Save ($)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        value={editGoal.monthly_contribution}
                                        onChange={(e) => setEditGoal({ ...editGoal, monthly_contribution: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 ml-1">Target Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                        value={editGoal.target_date}
                                        onChange={(e) => setEditGoal({ ...editGoal, target_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 ml-1">Status</label>
                                <select
                                    className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none"
                                    value={editGoal.status}
                                    onChange={(e) => setEditGoal({ ...editGoal, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold text-white transition-all shadow-lg shadow-blue-600/20 mt-4">
                                Update Goal
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-slate-900 border border-white/10 p-8 rounded-[2rem] max-w-sm w-full space-y-6 text-center shadow-2xl relative">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Delete Goal?</h3>
                            <p className="text-slate-400 text-sm">This action cannot be undone. All progress data will be lost.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 p-3 rounded-xl font-bold text-slate-300 transition-all">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 p-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-red-600/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
