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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [kycStatus, setKycStatus] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetchingQuestions(true);

        const user = await getCurrentUser();
        if (!user) {
          toast.error("Please log in to take the assessment.");
          navigate("/login");
          return;
        }
        setUserId(user.id);

        const data = await getRiskQuestions();
        const questionsArray = Array.isArray(data) ? data : data.questions;
        setQuestions(questionsArray?.slice(0, 5) || []);

      } catch (err) {
        toast.error("Failed to load questions.");
      } finally {
        setIsFetchingQuestions(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { questionId, score };
      return updated;
    });

    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      toast.error("Please answer all questions.");
      return;
    }

    if (!kycStatus) {
      toast.error("Please select KYC status.");
      return;
    }

    setIsLoading(true);

    try {
      await submitRiskAssessment(answers, userId, kycStatus);
      toast.success("Assessment completed! 🎉", {
        position: "top-center",
        autoClose: 2000
      });
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      toast.error("Error submitting assessment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h3>
          <p className="text-gray-600 mb-4">Please contact support</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header with Home Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </button>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-t-4 border-blue-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Risk Assessment</h1>
              <p className="text-gray-600 mt-1">Help us understand your investment preferences</p>
            </div>
          </div>

          {/* Progress Info */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span className="font-medium">Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-medium">{Math.round(progressPercent)}% Complete</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <RiskQuestion
            question={`${currentIndex + 1}. ${questions[currentIndex].question}`}
            options={questions[currentIndex].options}
            onAnswer={(score) =>
              handleAnswer(questions[currentIndex].question_id, score)
            }
          />
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <div className="flex justify-start mb-8">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 border-2 border-gray-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous Question
            </button>
          </div>
        )}

        {/* KYC Question */}
        {currentIndex === questions.length - 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {questions.length + 1}. KYC Verification Status
                </h3>
                <p className="text-gray-600 mb-4">Has your KYC (Know Your Customer) been verified?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setKycStatus("verified")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  kycStatus === "verified"
                    ? "bg-gradient-to-br from-green-600 to-emerald-600 text-white border-green-600 shadow-lg scale-105"
                    : "bg-white hover:bg-green-50 border-gray-200 hover:border-green-300 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      kycStatus === "verified" ? "bg-white/20" : "bg-green-100"
                    }`}>
                      <svg className={`w-6 h-6 ${kycStatus === "verified" ? "text-white" : "text-green-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-semibold">Yes, Verified</span>
                  </div>
                  {kycStatus === "verified" && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              <button
                onClick={() => setKycStatus("unverified")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  kycStatus === "unverified"
                    ? "bg-gradient-to-br from-orange-600 to-red-600 text-white border-orange-600 shadow-lg scale-105"
                    : "bg-white hover:bg-orange-50 border-gray-200 hover:border-orange-300 text-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      kycStatus === "unverified" ? "bg-white/20" : "bg-orange-100"
                    }`}>
                      <svg className={`w-6 h-6 ${kycStatus === "unverified" ? "text-white" : "text-orange-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="font-semibold">Not Verified</span>
                  </div>
                  {kycStatus === "unverified" && (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {currentIndex === questions.length - 1 && (
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !kycStatus}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg
                       hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-2xl
                       disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95
                       flex items-center gap-3"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <span>Complete Assessment</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RiskAssessment;