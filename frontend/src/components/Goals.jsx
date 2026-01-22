import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../api/goals";

const emptyForm = {
  title: "",
  target_amount: "",
  target_date: "",
  monthly_contribution: "",
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const getTimelineProgress = (goal) => {
    if (!goal?.created_at || !goal?.target_date) return 0;
    const start = new Date(goal.created_at).getTime();
    const end = new Date(goal.target_date).getTime();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    const now = Date.now();
    const pct = ((now - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const fetchGoals = async () => {
    try {
      const res = await getGoals();
      setGoals(res.goals || []);
    } catch (err) {
      toast.error(err.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (form.title.trim().length < 3) return "Title must be at least 3 characters";
    if (!form.target_amount || Number(form.target_amount) <= 0) return "Target amount must be greater than 0";
    if (!form.monthly_contribution || Number(form.monthly_contribution) <= 0) return "Monthly contribution must be greater than 0";
    if (!form.target_date) return "Target date is required";
    if (new Date(form.target_date) <= new Date()) return "Target date must be in the future";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        target_amount: Number(form.target_amount),
        target_date: form.target_date,
        monthly_contribution: Number(form.monthly_contribution),
        status: "active",
      };

      if (editingId) {
        await updateGoal(editingId, payload);
        toast.success("Goal updated successfully", {
          style: { background: "#ECFDF5", color: "#065F46" },
          progressStyle: { background: "#10B981" },
        });
      } else {
        await createGoal(payload);
        toast.success("Goal created successfully", {
          style: { background: "#ECFDF5", color: "#065F46" },
          progressStyle: { background: "#10B981" },
        });
      }

      resetForm();
      await fetchGoals();
    } catch (err) {
      toast.error(err.message || "Could not save goal", {
        style: { background: "#FEF2F2", color: "#991B1B" },
        progressStyle: { background: "#EF4444" },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title || "",
      target_amount: goal.target_amount || "",
      target_date: goal.target_date ? String(goal.target_date).slice(0, 10) : "",
      monthly_contribution: goal.monthly_contribution ?? "",
    });
  };

  const handleDelete = async (goalId) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await deleteGoal(goalId);
      toast.success("Goal deleted", {
        style: { background: "#ECFDF5", color: "#065F46" },
        progressStyle: { background: "#10B981" },
      });
      await fetchGoals();
    } catch (err) {
      toast.error(err.message || "Could not delete goal", {
        style: { background: "#FEF2F2", color: "#991B1B" },
        progressStyle: { background: "#EF4444" },
      });
    }
  };

  const handleStatusChange = async (goalId, status) => {
    try {
      await updateGoal(goalId, { status });
      const messages = {
        active: "Goal resumed. Contributions continue.",
        paused: "Goal paused. Contributions will stop.",
        completed: "Goal marked completed.",
      };
      toast.success(messages[status] || "Goal status updated", {
        style: { background: "#ECFDF5", color: "#065F46" },
        progressStyle: { background: "#10B981" },
      });
      await fetchGoals();
    } catch (err) {
      toast.error(err.message || "Could not update status", {
        style: { background: "#FEF2F2", color: "#991B1B" },
        progressStyle: { background: "#EF4444" },
      });
    }
  };

  const inputClass =
    "w-full h-[44px] rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-gray-900 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Goals</h1>
          <p className="text-sm text-slate-600 mt-1">Track your targets and contributions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingId ? "Edit Goal" : "Add New Goal"}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal title
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="e.g., House"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target amount
                  </label>
                  <input
                    name="target_amount"
                    value={form.target_amount}
                    onChange={onChange}
                    placeholder="e.g., 500000"
                    type="number"
                    min="0"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly contribution
                  </label>
                  <input
                    name="monthly_contribution"
                    value={form.monthly_contribution}
                    onChange={onChange}
                    placeholder="e.g., 20000"
                    type="number"
                    min="0"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target date
                  </label>
                  <input
                    name="target_date"
                    value={form.target_date}
                    onChange={onChange}
                    type="date"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full rounded-lg py-2.5 font-semibold transition ${
                    saving
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {editingId ? "Save Changes" : "Add Goal"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Your Goals</h2>
              <span className="text-sm text-slate-500">{goals.length} total</span>
            </div>

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <p className="text-gray-600">Loading goals...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center shadow-sm">
                <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <span className="text-indigo-600 font-bold">+</span>
                </div>
                <h3 className="text-gray-900 font-semibold">No goals yet</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Add your first goal to start tracking progress.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => {
                  const progress = Math.round(getTimelineProgress(goal));
                  const isPaused = goal.status === "paused";
                  const isCompleted = goal.status === "completed";
                  return (
                    <div
                      key={goal.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-semibold text-slate-900">
                            {goal.title}
                          </h3>
                          {goal.status && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isPaused
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {goal.status}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                          <p>
                            Target:{" "}
                            <span className="font-medium text-slate-900">
                              {goal.target_amount}
                            </span>
                          </p>
                          <p>
                            Monthly:{" "}
                            <span className="font-medium text-emerald-600">
                              {goal.monthly_contribution}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Target date: {String(goal.target_date).slice(0, 10)}
                          </p>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isCompleted
                                  ? "bg-emerald-500 w-full"
                                  : isPaused
                                  ? "bg-slate-400"
                                  : "bg-indigo-500"
                              }`}
                              style={!isCompleted ? { width: `${progress}%` } : undefined}
                            />
                          </div>
                          {!isCompleted && (
                            <p className="text-xs text-right text-slate-500 mt-1">
                              {progress}%
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 h-10 flex items-center justify-center">
                        {isCompleted ? (
                          <span className="text-sm text-emerald-600">Completed</span>
                        ) : (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleStatusChange(goal.id, "completed")}
                              className="flex-1 bg-emerald-600 text-white text-sm py-1.5 rounded-md"
                            >
                              Mark Complete
                            </button>
                            <button
                              onClick={() => handleStatusChange(goal.id, isPaused ? "active" : "paused")}
                              className="flex-1 bg-slate-200 text-slate-700 text-sm py-1.5 rounded-md"
                            >
                              {isPaused ? "Resume" : "Pause"}
                            </button>
                            <button
                              onClick={() => handleEdit(goal)}
                              className="text-indigo-600 text-sm px-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="text-red-500 text-sm px-2"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
