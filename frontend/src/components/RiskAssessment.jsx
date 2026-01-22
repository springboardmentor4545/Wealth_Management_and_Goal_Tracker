import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import RiskQuestion from "./RiskQuestion";
import { getRiskQuestions, submitRiskAssessment } from "../api/api";
import { getCurrentUser } from "../api/auth";

function RiskAssessment() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(true);
  const [userId, setUserId] = useState(null);
  const [kycCompleted, setKycCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          toast.error("Please log in");
          navigate("/login");
          return;
        }
        setUserId(user.id);

        const data = await getRiskQuestions();
        setQuestions(data.questions);
      } catch {
        toast.error("Failed to load questions");
      } finally {
        setIsFetchingQuestions(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAnswer = (questionId, optionId) => {
    setAnswers((prev) => {
      const filtered = prev.filter(a => a.question_id !== questionId);
      return [...filtered, { question_id: questionId, option_id: optionId }];
    });
  };

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    if (!kycCompleted) {
      toast.error("Complete KYC to unlock recommendations.");
      return;
    }

    setIsLoading(true);
    try {
      await submitRiskAssessment(answers, userId);
      toast.success("Risk profile saved. Redirecting to dashboard...", {
        autoClose: 1400,
        onClose: () => navigate("/dashboard"),
      });
    } catch {
      toast.error("Couldn't submit assessment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <p className="text-[#6B7280]">Loading assessment...</p>
      </div>
    );
  }

  const answeredCount = answers.length;
  const totalCount = questions.length || 1;
  const progress = Math.round((answeredCount / totalCount) * 100);
  const canSubmit = answeredCount >= questions.length && kycCompleted && !isLoading;

  return (
    <div className="min-h-screen bg-[#F4F5F7] px-6 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-8 border border-[#E5E7EB]">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-[#111827]">
            Complete Your Risk Profile
          </h1>
          <p className="text-[#6B7280] mt-1 text-[14px]">
            Answer a few questions to personalize your investment strategy.
          </p>

          <div className="mt-4 flex items-center justify-between text-[13px] text-[#6B7280]">
            <span>Risk Assessment</span>
            <span>
              Step {Math.min(answeredCount + 1, totalCount)} of {totalCount}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[#E5E7EB]">
            <div
              className="h-2 rounded-full bg-[#21C7A8] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, index) => (
          <div key={q.question_id} className="mb-6">
            <RiskQuestion
              question={`${index + 1}. ${q.question}`}
              options={q.options}
              onAnswer={(optionId) =>
                handleAnswer(q.question_id, optionId)
              }
            />
          </div>
        ))}

        {/* KYC */}
        <div className="mt-8 rounded-[20px] border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-[16px] font-semibold text-[#111827]">
                KYC Status
              </div>
              <div className="mt-1 text-[14px] text-[#6B7280]">
                Confirm whether your KYC is completed to unlock recommendations.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-[13px] ${kycCompleted ? "text-[#6B7280]" : "text-[#F2B879]"}`}>
                Not completed
              </span>
              <button
                type="button"
                onClick={() => setKycCompleted((v) => !v)}
                className={`relative h-7 w-12 rounded-full border transition
                  ${kycCompleted ? "border-[#21C7A8] bg-[#21C7A8]/20" : "border-[#D1D5DB] bg-white"}
                `}
                aria-pressed={kycCompleted}
                aria-label="Toggle KYC status"
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full transition
                    ${kycCompleted ? "left-6 bg-[#21C7A8]" : "left-1 bg-[#9CA3AF]"}
                  `}
                />
              </button>
              <span className={`text-[13px] ${kycCompleted ? "text-[#21C7A8]" : "text-[#6B7280]"}`}>
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex items-center justify-between">
          {!canSubmit && (
            <p className="text-[14px] text-[#6B7280]">
              {answeredCount < questions.length
                ? "Please answer all questions to continue."
                : "Complete KYC to unlock recommendations."}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-6 py-3 rounded-[16px] font-medium transition
              ${
                !canSubmit
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-[#0B0B0F] text-white hover:-translate-y-[1px] active:translate-y-0 hover:bg-black shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
              }`}
          >
            {isLoading ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default RiskAssessment;
