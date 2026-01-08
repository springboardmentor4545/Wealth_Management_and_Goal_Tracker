import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RiskQuestion from "./RiskQuestion";
import { riskQuestions } from "../data/data";
import { submitRiskAssessment } from "../api/api";

function RiskAssessment() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => [...prev, { questionId, score }]);
  };

  const handleSubmit = async () => {
    if (answers.length < riskQuestions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await submitRiskAssessment(answers);
      alert("✅ Assessment submitted successfully!");
      navigate("/");
    } catch (err) {
      setError(err.message || "An error occurred while submitting.");
      console.error("Error submitting risk assessment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Risk Assessment Questionnaire
        </h1>
        <div className="mt-2 text-sm text-gray-500">
          Progress: {answers.length}/{riskQuestions.length} questions answered
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {riskQuestions.map((q, index) => (
          <RiskQuestion
            key={q.id}
            question={`${index + 1}. ${q.question}`}
            options={q.options}
            onAnswer={(score) => handleAnswer(q.id, score)}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={answers.length < riskQuestions.length || isLoading}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition
            ${
              answers.length < riskQuestions.length || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }
          `}
        >
          {isLoading ? "Submitting..." : "Submit Assessment"}
        </button>
      </div>
    </div>
  );
}

export default RiskAssessment;
