import { useEffect, useState } from "react";
import api from "../api/api";
import CreateGoalModal from "./CreateGoalModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { toast } from "react-toastify";

function GoalsTable({ refresh }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGoal, setEditingGoal] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // ✅ FIX: Use "access_token" to match api.js
  const token = localStorage.getItem("access_token");

  /* ===============================
     FETCH GOALS (SECURED)
     =============================== */
  const fetchGoals = async () => {
    if (!token) {
      console.log("❌ No token found, skipping fetch");
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Fetching goals...");
      setLoading(true);
      const res = await api.get("/goals/");
      console.log("✅ Goals fetched:", res.data);
      setGoals(res.data || []);
    } catch (err) {
      console.error("❌ Fetch goals error:", err);
      console.error("Error response:", err.response?.data);
      toast.error("Failed to fetch goals");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 GoalsTable useEffect triggered. Token exists:", !!token);
    if (token) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, [token, refresh]);

  /* ===============================
     DELETE GOAL (SECURED)
     =============================== */
  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      toast.success("Goal deleted successfully");
      setDeletingGoal(null);
      fetchGoals();
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Failed to delete goal");
    }
  };

  // Filter and sort goals
  const getFilteredGoals = () => {
    let filtered = [...goals];

    if (filterType !== "all") {
      filtered = filtered.filter((goal) => goal.goal_type === filterType);
    }

    // Sort
    if (sortBy === "progress") {
      filtered.sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0));
    } else if (sortBy === "amount") {
      filtered.sort((a, b) => b.target_amount - a.target_amount);
    }

    return filtered;
  };

  const filteredGoals = getFilteredGoals();

  // Get unique goal types for filter
  const goalTypes = [...new Set(goals.map((g) => g.goal_type))];

  // Calculate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => (g.progress_percentage || 0) >= 100).length;
  const totalTargetAmount = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading your goals...</p>
      </div>
    );
  }

  return (
    <div>
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Goals Yet</h3>
          <p className="text-gray-600">Create your first financial goal to get started on your wealth journey</p>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 px-6 pt-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium mb-1">Total Goals</p>
                  <p className="text-2xl font-bold text-purple-900">{totalGoals}</p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{completedGoals}</p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total Target</p>
                  <p className="text-2xl font-bold text-blue-900">₹{totalTargetAmount.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 px-6 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="all">All Goals</option>
                {goalTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="date">Date Created</option>
                <option value="progress">Progress</option>
                <option value="amount">Target Amount</option>
              </select>
            </div>
          </div>

          {/* Goals Grid for Mobile, Table for Desktop */}
          <div className="px-6 pb-6">
            {/* Mobile View - Cards */}
            <div className="block md:hidden space-y-4">
              {filteredGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-5 border-2 border-purple-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 capitalize mb-1">
                        {goal.goal_type}
                      </h4>
                      <p className="text-sm text-gray-600">Target: ₹{goal.target_amount?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingGoal(goal)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Contribution:</span>
                      <span className="font-semibold text-gray-900">₹{goal.monthly_contribution?.toLocaleString()}</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-purple-600">{goal.progress_percentage ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${Math.min(goal.progress_percentage ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border-2 border-gray-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Goal Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Target Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Monthly</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Progress</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGoals.map((goal, index) => (
                    <tr
                      key={goal.id}
                      className="hover:bg-purple-50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {goal.goal_type?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 capitalize">{goal.goal_type}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">₹{goal.target_amount?.toLocaleString()}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-gray-700">₹{goal.monthly_contribution?.toLocaleString()}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-purple-600">
                              {goal.progress_percentage ?? 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.min(goal.progress_percentage ?? 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm flex items-center gap-1 shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>

                          <button
                            onClick={() => setDeletingGoal(goal)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-1 shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingGoal && (
        <CreateGoalModal
          editGoal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onGoalCreated={() => {
            setEditingGoal(null);
            fetchGoals();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingGoal && (
        <DeleteConfirmModal
          isOpen={!!deletingGoal}
          onClose={() => setDeletingGoal(null)}
          onConfirm={() => deleteGoal(deletingGoal.id)}
          goalName={deletingGoal.goal_type}
        />
      )}
    </div>
  );
}

export default GoalsTable;