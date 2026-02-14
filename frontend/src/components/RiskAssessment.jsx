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
  const [kycStatus, setKycStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetchingQuestions(true);

        const user = await getCurrentUser();
        if (!user) {
          setError("Please log in to take the assessment.");
          toast.error("Please log in to take the assessment.");
          navigate("/login");
          return;
        }

        setUserId(user.id);

        const data = await getRiskQuestions();
        setQuestions(data.questions);
      } catch (err) {
        setError("Failed to load questions. Please try again.");
        toast.error("Failed to load questions. Please try again.");
      } finally {
        setIsFetchingQuestions(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, score }];
    });
  };

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      setError("Please answer all questions before submitting.");
      toast.error("Please answer all questions before submitting.");
      return;
    }

    if (kycStatus === null) {
      setError("Please answer the KYC verification question.");
      return;
    }

    if (!userId) {
      setError("User not authenticated. Please log in again.");
      toast.error("User not authenticated. Please log in again.");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await submitRiskAssessment(answers, userId, kycStatus);

      // ✅ MARK RISK AS COMPLETED
      localStorage.setItem("riskCompleted", "true");

      setShowToast(true);
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (err) {
      setError("An error occurred while submitting.");
      toast.error("Error submitting risk assessment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingQuestions) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-orange-600 font-semibold">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-12">
      <div className="max-w-5xl mx-auto px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/home")}
          className="mb-6 flex items-center text-red-600 hover:text-red-800 font-medium transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        <div className="mb-12 text-center">
          <div className="inline-block p-3 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500 bg-clip-text text-transparent mb-4">
            Risk Assessment Questionnaire
          </h1>
          <p className="text-orange-600 mb-6 text-lg">
            Help us understand your investment preferences
          </p>
        </div>

        {/* Progress Bar */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-4 mb-8 shadow-sm">
          <div className="w-3/4 mx-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-red-600">Progress</span>
              <span className="text-sm font-semibold text-red-700">
                {answers.length}/{questions.length} completed
              </span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(answers.length / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-8 py-5 rounded-lg mb-8 shadow-lg">
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.question_id}
              className="bg-yellow-50 rounded-xl shadow-lg p-8 border-l-8 border-red-500"
            >
              <RiskQuestion
                question={`${index + 1}. ${q.question}`}
                options={q.options}
                onAnswer={(score) => handleAnswer(q.question_id, score)}
              />
            </div>
          ))}
        </div>

        {/* KYC Question */}
        <div className="bg-yellow-50 rounded-xl shadow-lg p-8 mt-6 border-l-8 border-orange-500">
          <h3 className="text-lg font-semibold mb-3">
            {questions.length + 1}. Has your KYC been verified?
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setKycStatus("verified")}
              className={`w-full px-4 py-3 rounded border ${
                kycStatus === "verified"
                  ? "bg-red-500 text-white"
                  : "hover:bg-red-100"
              }`}
            >
              Yes, my KYC is verified
            </button>

            <button
              onClick={() => setKycStatus("unverified")}
              className={`w-full px-4 py-3 rounded border ${
                kycStatus === "unverified"
                  ? "bg-red-500 text-white"
                  : "hover:bg-red-100"
              }`}
            >
              No, my KYC is not verified
            </button>
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={answers.length < questions.length || kycStatus === null || isLoading}
            className="px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 disabled:bg-gray-400"
          >
            {isLoading ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>

        {showToast && (
          <div className="fixed top-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl">
            Assessment submitted successfully!
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskAssessment;
