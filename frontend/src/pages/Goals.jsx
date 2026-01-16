import React, { useEffect, useState } from 'react'
import api from '../lib/api'

// Simple Goal Card Component
function GoalCard({ goal, onDelete }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-800 text-lg">{goal.title}</h3>
                <button 
                    onClick={() => onDelete(goal.id)}
                    className="text-red-400 hover:text-red-600 px-2"
                    title="Delete Goal"
                >
                    ✕
                </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <span className="text-gray-500 block text-xs">Target</span>
                    <span className="font-semibold">${goal.target_amount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 block text-xs">Date</span>
                    <span className="font-semibold">{new Date(goal.target_date).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Progress Section */}
            <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-600 font-medium">{goal.progress_percentage}% Done</span>
                    <span className="text-gray-400">{goal.duration_months} mos left</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${goal.progress_percentage}%` }}
                    ></div>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Monthly Need:</span>
                <span className="font-bold text-green-600">${goal.required_monthly_investment.toLocaleString()} / mo</span>
            </div>
        </div>
    )
}

export default function Goals({ token, onBack }) {
    const [goals, setGoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    
    // Form State
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [date, setDate] = useState('')
    const [monthly, setMonthly] = useState('')
    const [msg, setMsg] = useState(null)

    useEffect(() => {
        loadGoals()
    }, [token])

    const loadGoals = async () => {
        setLoading(true)
        const res = await api.getGoals(token)
        if (res.status === 200) {
            setGoals(res.body)
        } else {
            console.error("Failed to load goals")
        }
        setLoading(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMsg(null)
        
        const payload = {
            title,
            target_amount: parseInt(amount),
            target_date: new Date(date).toISOString(), // Send ISO string
            monthly_contribution: parseInt(monthly) || 0
        }

        const res = await api.createGoal(payload, token)
        if (res.status === 200) {
            setShowForm(false)
            // Reset form
            setTitle(''); setAmount(''); setDate(''); setMonthly('')
            loadGoals() // Reload list
        } else {
            setMsg("Error creating goal. Please check fields.")
        }
    }

    const handleDelete = async (id) => {
        if(!confirm("Are you sure you want to delete this goal?")) return;
        const res = await api.deleteGoal(id, token)
        if (res.status === 204) {
            loadGoals()
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-500 hover:text-blue-600">← Back</button>
                    <h1 className="text-xl font-bold text-gray-800">My Goals</h1>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                    {showForm ? 'Cancel' : '+ New Goal'}
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4">
                
                {/* Create Goal Form */}
                {showForm && (
                     <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 animate-fade-in-down">
                        <h2 className="text-lg font-bold mb-4 text-gray-800">Add New Financial Goal</h2>
                        {msg && <div className="text-red-500 text-sm mb-3">{msg}</div>}
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Dream House, New Car" value={title} onChange={e=>setTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount ($)</label>
                                <input required type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="50000" value={amount} onChange={e=>setAmount(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                                <input required type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={date} onChange={e=>setDate(e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Monthly Contribution ($) <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="500" value={monthly} onChange={e=>setMonthly(e.target.value)} />
                            </div>
                            <div className="col-span-2 mt-2">
                                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">Create Goal</button>
                            </div>
                        </form>
                     </div>
                )}

                {/* Goals List */}
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading goals...</div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-4xl mb-3">🎯</div>
                        <h3 className="text-lg font-medium text-gray-900">No goals yet</h3>
                        <p className="text-gray-500 mb-4">Set your first financial target to get started.</p>
                        <button onClick={() => setShowForm(true)} className="text-blue-600 font-medium hover:underline">Create a Goal</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map(g => (
                            <GoalCard key={g.id} goal={g} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
