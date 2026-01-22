import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Goals() {
  const navigate = useNavigate();

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
    <div className="p-6 max-w-6xl mx-auto">
      {/* -------- Back Button -------- */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-white hover:text-blue-50 transition font-medium"
      >
        ← Back
      </button>

      {/* -------- Title + Add Goal -------- */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Your Goals</h2>

        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingGoal(null);
            }}
            className="bg-white px-5 py-2 rounded-lg hover:bg-blue-50 transition"
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
            className="w-full max-w-md bg-white rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] p-6 space-y-4"
          >
            <h3 className="text-2xl font-semibold text-center text-blue-700">
              {editingGoal ? "Edit Goal" : "Add New Goal"}
            </h3>

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
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
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
                Target Amount
              </label>
              <input
                type="number"
                name="target_amount"
                value={newGoalForm.target_amount}
                onChange={handleNewGoalChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Monthly Contribution
              </label>
              <input
                type="number"
                name="monthly_contribution"
                value={newGoalForm.monthly_contribution}
                onChange={handleNewGoalChange}
                required
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
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
                className="w-full border border-blue-300 bg-blue-50 p-2 rounded
                focus:border-blue-700 focus:ring-1 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded"
              >
                {editingGoal ? "Update Goal" : "Save"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-300 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------- Goals Table ---------------- */}
      {!showAddForm && goals.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] p-6">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Goal",
                  "Target",
                  "Monthly",
                  "Target Date",
                  "Months Left",
                  "Invested",
                  "Progress",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="border border-blue-500 bg-blue-50 p-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {goals.map((goal) => {
                const derivedStatus = goal.status;

                return (
                  <tr key={goal.id} className="text-center">
                    <td className="border border-blue-500 p-2">
                      {goal.goal_type}
                    </td>
                    <td className="border border-blue-500 p-2">
                      ₹{goal.target_amount}
                    </td>
                    <td className="border border-blue-500 p-2">
                      ₹{goal.monthly_contribution}
                    </td>
                    <td className="border border-blue-500 p-2">
                      {goal.target_date}
                    </td>
                    <td className="border border-blue-500 p-2">
                      {goal.months_remaining}
                    </td>
                    <td className="border border-blue-500 p-2">
                      ₹{goal.invested_so_far}
                    </td>
                    <td className="border border-blue-500 p-2">
                      <div className="w-full bg-blue-100 rounded h-4">
                        <div
                          className="bg-green-500 h-4 rounded"
                          style={{ width: `${goal.progress_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm">
                        {goal.progress_percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="border border-blue-500 p-2">
                      {derivedStatus}
                    </td>
                    <td className="border border-blue-500 p-2 space-x-2">
                      {derivedStatus !== "completed" && (
                        <>
                          <button
                            onClick={() =>
                              updateStatus(
                                goal.id,
                                derivedStatus === "active"
                                  ? "paused"
                                  : "active"
                              )
                            }
                            className="text-yellow-600"
                          >
                            {derivedStatus === "active"
                              ? "Pause"
                              : "Resume"}
                          </button>
                          <button
                            onClick={() => startEdit(goal)}
                            className="text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(goal.id)}
                            className="text-red-600"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!showAddForm && goals.length === 0 && (
        <p className="text-left text-xl text-white">No goals yet....</p>
      )}
    </div>
  );
}
