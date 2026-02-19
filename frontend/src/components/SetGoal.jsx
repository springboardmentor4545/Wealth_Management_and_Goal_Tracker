import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import { fetchGoals, addGoal, updateGoal, deleteGoal } from "../api/goal";
import { toast } from "react-toastify";

export default function SetGoal() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [form, setForm] = useState({
    goal_type: "",
    target_amount: "",
    target_date: "",
    monthly_contribution: "",
    status: "active",
  });

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      if (!u) {
        toast.error("User not logged in");
        return;
      }
      setUser(u);
      loadGoals();
    })();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await fetchGoals();

      // ✅ SAFE: supports both styles:
      // - old goal.js returning axios response -> res.data
      // - new goal.js returning data directly -> res
      setGoals(res?.data ?? res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load goals");
    }
  };

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setForm({
        goal_type: goal.goal_type,
        target_amount: goal.target_amount,
        target_date: goal.target_date,
        monthly_contribution: goal.monthly_contribution,
        status: goal.status,
      });
    } else {
      setEditingGoal(null);
      setForm({
        goal_type: "",
        target_amount: "",
        target_date: "",
        monthly_contribution: "",
        status: "active",
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;

    // ✅ ONLY user-id related change: REMOVE user_id from payload
    // Backend gets user_id from JWT (current_user)
    const payload = {
      goal_type: form.goal_type,
      target_amount: Number(form.target_amount),
      target_date: form.target_date,
      monthly_contribution: Number(form.monthly_contribution),
      status: form.status,
    };

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.goal_id, payload);
        toast.success("Goal updated");
      } else {
        await addGoal(payload);
        toast.success("Goal added");
      }
      setShowModal(false);
      loadGoals();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save goal");
    }
  };

  const handleDelete = async (goal_id) => {
    if (!window.confirm("Delete this goal?")) return;
    try {
      await deleteGoal(goal_id);
      toast.success("Goal deleted");
      loadGoals();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  // Helper for safe progress value
  const getProgress = (goal) => {
    const p = Number(goal?.completion_percentage ?? 0);
    if (Number.isNaN(p)) return 0;
    return Math.max(0, Math.min(100, p));
  };

  return (
    <div className="p-6 bg-gradient-to-br from-yellow-200 via-orange-300 to-yellow-100 min-h-screen">
      {/* Top bar: Back + Title */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 hover:bg-white shadow"
          title="Back to Home"
        >
          <span className="text-xl">←</span>
          <span className="font-semibold text-yellow-900">Back</span>
        </button>

        <h1 className="text-4xl font-extrabold text-center text-yellow-900 flex-1">
          Set Your Financial Goals
        </h1>

        {/* spacer so title stays centered */}
        <div className="w-[110px]" />
      </div>

      <div className="flex justify-end mb-4">
        <button
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold shadow"
          onClick={() => openModal()}
        >
          + Add Goal
        </button>
      </div>

      {/* ================= GOALS TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-xl shadow-lg">
          <thead className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3 text-left">Target Date</th>
              <th className="p-3 text-left">User / Month</th>
              <th className="p-3 text-left">Required / Month</th>
              <th className="p-3 text-left">Progress</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {goals.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500">
                  No goals set yet
                </td>
              </tr>
            )}

            {goals.map((goal) => {
              const progress = getProgress(goal);

              return (
                <tr key={goal.goal_id} className="border-t">
                  <td className="p-3 capitalize">{goal.goal_type}</td>
                  <td className="p-3">₹{goal.target_amount}</td>
                  <td className="p-3">{goal.target_date}</td>

                  {/* user monthly contribution */}
                  <td className="p-3">₹{goal.monthly_contribution}</td>

                  {/* calculated */}
                  <td className="p-3">₹{goal.required_monthly_investment}</td>

                  {/* Progress bar + % */}
                  <td className="p-3 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-semibold text-yellow-900 w-[52px] text-right">
                        {progress}%
                      </span>
                    </div>
                  </td>

                  <td className="p-3 space-x-2">
                    <button
                      className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                      onClick={() => openModal(goal)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                      onClick={() => handleDelete(goal.goal_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingGoal ? "Edit Goal" : "Add Goal"}
            </h2>

            <select
              name="goal_type"
              value={form.goal_type}
              onChange={handleChange}
              className="w-full border p-2 mb-2 rounded"
            >
              <option value="">Select goal type</option>
              <option value="retirement">Retirement</option>
              <option value="home">Home</option>
              <option value="education">Education</option>
              <option value="custom">Custom</option>
            </select>

            <input
              type="number"
              name="target_amount"
              value={form.target_amount}
              onChange={handleChange}
              placeholder="Target amount"
              className="w-full border p-2 mb-2 rounded"
            />

            <input
              type="date"
              name="target_date"
              value={form.target_date}
              onChange={handleChange}
              className="w-full border p-2 mb-2 rounded"
            />

            <input
              type="number"
              name="monthly_contribution"
              value={form.monthly_contribution}
              onChange={handleChange}
              placeholder="Monthly contribution (user can invest)"
              className="w-full border p-2 mb-2 rounded"
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border p-2 mb-4 rounded"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
