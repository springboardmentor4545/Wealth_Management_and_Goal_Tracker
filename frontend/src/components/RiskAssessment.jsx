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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Ensure user is authenticated
        await getCurrentUser();

        // Fetch risk questions
        const data = await getRiskQuestions();
        setQuestions(data.questions);
      } catch (err) {
        toast.error("Please login again.");
        navigate("/login");
      } finally {
        setIsFetchingQuestions(false);
      }
    };

    fetchQuestions();
  }, [navigate]);

  const handleAnswer = (questionId, score) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, score }];
    });
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
      // ✅ SEND EXACTLY WHAT schema.py EXPECTS
      await submitRiskAssessment({
        answers: answers.map((a) => ({
          questionId: a.questionId,
          score: a.score,
        })),
        kyc_status: kycStatus,
      });

      // ✅ THIS WAS MISSING (BLOCKED DASHBOARD)
      localStorage.setItem("riskCompleted", "true");

      toast.success("Risk assessment completed!");
      navigate("/home");
    } catch (err) {
      console.error(err);
      toast.error("Error submitting risk assessment.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading questions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-12">
      <div className="max-w-5xl mx-auto px-8">
        <h1 className="text-4xl font-bold text-center mb-10">
          Risk Assessment Questionnaire
        </h1>

        {questions.map((q, index) => (
          <div
            key={q.question_id}
            className="bg-yellow-50 p-6 rounded-xl mb-6 shadow"
          >
            <RiskQuestion
              question={`${index + 1}. ${q.question}`}
              options={q.options}
              onAnswer={(score) => handleAnswer(q.question_id, score)}
            />
          </div>
        ))}

        <div className="bg-yellow-50 p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-3">
            {questions.length + 1}. Has your KYC been verified?
          </h3>

          <button
            onClick={() => setKycStatus("verified")}
            className={`w-full mb-2 p-3 rounded border ${
              kycStatus === "verified" ? "bg-red-500 text-white" : ""
            }`}
          >
            Yes, my KYC is verified
          </button>

          <button
            onClick={() => setKycStatus("unverified")}
            className={`w-full p-3 rounded border ${
              kycStatus === "unverified" ? "bg-red-500 text-white" : ""
            }`}
          >
            No, my KYC is not verified
          </button>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-10 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"
          >
            {isLoading ? "Submitting..." : "Submit Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RiskAssessment;
