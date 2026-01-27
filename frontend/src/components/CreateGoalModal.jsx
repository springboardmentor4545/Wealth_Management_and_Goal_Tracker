import { useState, useEffect } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

function CreateGoalModal({ editGoal, onGoalCreated, onClose }) {
  const [goalType, setGoalType] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setGoalType(editGoal.goal_type);
      setTargetAmount(editGoal.target_amount);
      setMonthlyContribution(editGoal.monthly_contribution || "");
      setTargetDate(editGoal.target_date);
    }
  }, [editGoal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        goal_type: goalType,
        target_amount: Number(targetAmount),
        monthly_contribution: Number(monthlyContribution),
        target_date: targetDate,
        ...(editGoal && { status: "active" }),
      };

      console.log("Payload being sent:", payload);

      if (editGoal) {
        await api.put(`/goals/${editGoal.id}`, payload);
        toast.success("Goal updated successfully");
      } else {
        await api.post("/goals/", payload);
        toast.success("Goal created successfully");
      }

      onGoalCreated();
      onClose();
    } catch (err) {
      console.error("GOAL SAVE ERROR:", err);
      toast.error("Failed to save goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goalTypeOptions = [
    { value: "retirement", label: "Retirement", icon: "🏖️", color: "from-blue-500 to-cyan-500" },
    { value: "education", label: "Education", icon: "🎓", color: "from-purple-500 to-pink-500" },
    { value: "travel", label: "Travel", icon: "✈️", color: "from-orange-500 to-red-500" },
    { value: "emergency", label: "Emergency", icon: "🛡️", color: "from-green-500 to-emerald-500" },
    { value: "home", label: "Home", icon: "🏠", color: "from-indigo-500 to-purple-500" },
    { value: "vehicle", label: "Vehicle", icon: "🚗", color: "from-gray-600 to-gray-800" },
  ];

  const selectedGoalType = goalTypeOptions.find(opt => opt.value === goalType);

  const calculateMonths = () => {
    if (targetAmount && monthlyContribution && Number(monthlyContribution) > 0) {
      return Math.ceil(Number(targetAmount) / Number(monthlyContribution));
    }
    return 0;
  };

  const estimatedMonths = calculateMonths();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl p-4 sm:p-6 flex-shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
              {selectedGoalType?.icon || "🎯"}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {editGoal ? "Edit Goal" : "Create Goal"}
              </h3>
              <p className="text-purple-100 text-xs sm:text-sm mt-1 hidden sm:block">
                {editGoal ? "Update your financial goal" : "Set your financial target"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-5">
            {/* Goal Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Goal Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {goalTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGoalType(option.value)}
                    className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      goalType === option.value
                        ? `border-purple-500 bg-gradient-to-br ${option.color} text-white shadow-lg transform scale-105`
                        : "border-gray-200 hover:border-purple-300 bg-white text-gray-700"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{option.icon}</div>
                    <div className="text-xs sm:text-sm font-medium">{option.label}</div>
                    {goalType === option.value && (
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-2.5 sm:top-3 text-gray-500 font-medium text-sm sm:text-base">₹</span>
                <input
                  type="number"
                  placeholder="100000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-base sm:text-lg font-semibold"
                />
              </div>
              {targetAmount && (
                <p className="text-xs text-gray-600 mt-1.5">
                  Target: ₹{Number(targetAmount).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Monthly Contribution */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Contribution
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-2.5 sm:top-3 text-gray-500 font-medium text-sm sm:text-base">₹</span>
                <input
                  type="number"
                  placeholder="5000"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  required
                  min="1"
                  className="w-full pl-8 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-base sm:text-lg font-semibold"
                />
              </div>
              {monthlyContribution && (
                <p className="text-xs text-gray-600 mt-1.5">
                  Monthly: ₹{Number(monthlyContribution).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                <span className="absolute right-3 sm:right-4 top-2.5 sm:top-3 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Calculation Summary */}
            {targetAmount && monthlyContribution && estimatedMonths > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border-2 border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Estimated Timeline
                </h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-purple-700">Months Required</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{estimatedMonths}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-purple-700">Years Required</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">{(estimatedMonths / 12).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 pt-0 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                {editGoal ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Update Goal</span>
                    <span className="sm:hidden">Update</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Create Goal</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGoalModal;