import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [newGoalForm, setNewGoalForm] = useState({
    goal_type: "",
    target_amount: "",
    monthly_contribution: "",
    target_date: "",
    status: "active",
  });

  // ---------------- Fetch Goals ----------------
  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch {
      toast.error("Failed to fetch goals");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // ---------------- Form Handlers ----------------
  const handleNewGoalChange = (e) => {
    setNewGoalForm({ ...newGoalForm, [e.target.name]: e.target.value });
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...newGoalForm,
        target_amount: Number(newGoalForm.target_amount),
        monthly_contribution: Number(newGoalForm.monthly_contribution),
      };

      if (editingGoal) {
        await api.put(`/goals/${editingGoal.id}`, payload);
        toast.success("Goal updated successfully!");
      } else {
        await api.post("/goals", payload);
        toast.success("Goal added successfully!");
      }

      resetForm();
      fetchGoals();
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const resetForm = () => {
    setNewGoalForm({
      goal_type: "",
      target_amount: "",
      monthly_contribution: "",
      target_date: "",
      status: "active",
    });
    setEditingGoal(null);
    setShowAddForm(false);
  };

  // ---------------- Edit ----------------
  const startEdit = (goal) => {
    if (goal.progress_percentage >= 95) {
      toast.info("Completed goals cannot be edited");
      return;
    }

    setEditingGoal(goal);
    setNewGoalForm({
      goal_type: goal.goal_type,
      target_amount: goal.target_amount,
      monthly_contribution: goal.monthly_contribution,
      target_date: goal.target_date,
      status: goal.status,
    });
    setShowAddForm(true);
  };

  // ---------------- Pause / Resume ----------------
  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/goals/${id}/status?status=${status}`);
      toast.success(`Goal ${status}`);
      fetchGoals();
    } catch {
      toast.error("Failed to update goal status");
    }
  };

  // ---------------- Delete ----------------
  const confirmDelete = (id) => {
    const toastId = toast.info(
      <div>
        <p className="font-medium">Delete this goal?</p>
        <div className="mt-3 flex justify-center gap-3">
          <button
            onClick={async () => {
              try {
                await api.delete(`/goals/${id}`);
                toast.dismiss(toastId);
                toast.success("Goal deleted");
                fetchGoals();
              } catch {
                toast.dismiss(toastId);
                toast.error("Delete failed");
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(toastId)}
            className="bg-gray-400 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      </div>,
      { autoClose: false, closeButton: false }
    );
  };

  return (
    <div className="py-4 px-4">
      <div className="max-w-6xl mx-auto pt-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            Your Goals
          </h2>

          {!showAddForm && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingGoal(null);
              }}
              className="px-6 py-2 rounded-lg shadow
                bg-blue-700 text-white hover:bg-blue-600 dark:bg-blue-400"
            >
              + Add Goal
            </button>
          )}
        </div>

        {/* ---------------- Add / Edit Goal Form ---------------- */}
        {showAddForm && (
          <div className="flex justify-center mb-10">
            <form
              onSubmit={handleSubmitGoal}
              className="w-full max-w-xl rounded-2xl shadow-xl p-8
                bg-white dark:bg-gray-800"
            >
              <h3 className="text-2xl font-semibold text-center mb-6
                text-blue-700 dark:text-blue-300">
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </h3>

              <div className="grid grid-cols-1 gap-4">

                {/* Goal Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Goal Type
                  </label>
                  <select
                    name="goal_type"
                    value={newGoalForm.goal_type}
                    onChange={handleNewGoalChange}
                    required
                    className="w-full p-2 rounded border
                      bg-blue-50 dark:bg-gray-700
                      border-blue-300 dark:border-gray-600
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-500"
                  >
                    <option value="">Select Goal Type</option>
                    <option value="retirement">Retirement</option>
                    <option value="home">Home</option>
                    <option value="education">Education</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    value={newGoalForm.target_amount}
                    onChange={handleNewGoalChange}
                    required
                    className="w-full p-2 rounded border
                      bg-blue-50 dark:bg-gray-700
                      border-blue-300 dark:border-gray-600
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-500"
                  />
                </div>

                {/* Monthly Contribution */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monthly Contribution (₹)
                  </label>
                  <input
                    type="number"
                    name="monthly_contribution"
                    value={newGoalForm.monthly_contribution}
                    onChange={handleNewGoalChange}
                    required
                    className="w-full p-2 rounded border
                      bg-blue-50 dark:bg-gray-700
                      border-blue-300 dark:border-gray-600
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-500"
                  />
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    name="target_date"
                    value={newGoalForm.target_date}
                    onChange={handleNewGoalChange}
                    required
                    className="w-full p-2 rounded border
                      bg-blue-50 dark:bg-gray-700
                      border-blue-300 dark:border-gray-600
                      text-gray-900 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-500">
                  {editingGoal ? "Update Goal" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 dark:bg-gray-600
                    text-gray-800 dark:text-white
                    py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- Goals Table ---------------- */}
        {!showAddForm && goals.length > 0 && (
          <div className="rounded-2xl shadow-lg p-6 overflow-x-auto
            bg-white dark:bg-gray-800">
            <table className="w-full text-center">
              <thead className="bg-blue-100 dark:bg-gray-700">
                <tr>
                  {[
                    "Goal",
                    "Target Amount",
                    "Monthly Contribution",
                    "Target Date",
                    "Months Left",
                    "Invested so far",
                    "Progress",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="p-4 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {goals.map((goal) => (
                  <tr key={goal.id} className="border-t dark:border-gray-700">
                    <td className="p-2 capitalize">{goal.goal_type}</td>
                    <td className="p-2">₹{goal.target_amount}</td>
                    <td className="p-2">₹{goal.monthly_contribution}</td>
                    <td className="p-2">{goal.target_date}</td>
                    <td className="p-2">{goal.months_remaining}</td>
                    <td className="p-2">₹{goal.invested_so_far}</td>

                    <td className="p-2">
                      <div className="w-full bg-blue-200 dark:bg-gray-600 rounded h-3">
                        <div
                          className="bg-green-500 h-3 rounded"
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-xs">
                        {goal.progress_percentage.toFixed(1)}%
                      </span>
                    </td>

                    <td className="p-2 capitalize">{goal.status}</td>

                    <td className="p-2 space-x-2">
                      {goal.status !== "completed" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                goal.id,
                                goal.status === "active" ? "paused" : "active"
                              )
                            }
                            className="text-yellow-500 hover:underline"
                          >
                            {goal.status === "active" ? "Pause" : "Resume"}
                          </button>
                          <button
                            onClick={() => startEdit(goal)}
                            className="text-blue-500 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(goal.id)}
                            className="text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!showAddForm && goals.length === 0 && (
          <div className="text-center text-blue-700 dark:text-blue-400 text-lg mt-10">
            No goals yet. Start by adding one 🎯
          </div>
        )}

      </div>
    </div>
  );
}
