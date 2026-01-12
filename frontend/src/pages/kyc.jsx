import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Kyc() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [name, setName] = useState("");
  const [pan, setPan] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch risk questions on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(
          "http://127.0.0.1:8000/api/v1/auth/risk-profile/questions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching questions:", err);
        alert("Error loading risk questions. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQuestions();
    }
  }, [token]);

  const handleAnswer = (qid, score) => {
    setAnswers({ ...answers, [qid]: score });
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      alert("❌ Please enter Full Name");
      return;
    }
    if (!pan.trim()) {
      alert("❌ Please enter PAN Number");
      return;
    }
    if (Object.keys(answers).length !== 7) {
      alert("❌ Please answer all 7 risk profiling questions");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Submit KYC (must be FormData)
console.log("Submitting KYC...");

const kycForm = new FormData();
kycForm.append("name", name);
kycForm.append("pan", pan);

await axios.post(
  "http://127.0.0.1:8000/api/v1/auth/kyc/submit",
  kycForm,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      console.log("KYC submitted successfully");

      // 2. Verify KYC
      console.log("Verifying KYC...");
      await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/kyc/verify",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("KYC verified successfully");

      // 3. Submit Risk Profile
      console.log("Submitting risk profile...", answers);
      await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/risk-profile/submit",
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Risk profile submitted successfully");

      setTimeout(() => {
  alert("✅ KYC and Risk Profile submitted successfully!");
  navigate("/dashboard");
}, 50);


    } catch (err) {
      console.error("Submission error:", err);
      alert(
        "❌ Submission failed: " +
          (err.response?.data?.detail ||
            err.response?.data?.message ||
            err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-white">Loading KYC Form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="mb-8 border-b border-gray-700 pb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your KYC</h1>
            <p className="text-gray-400">
              Provide your details and complete the risk profiling questionnaire
            </p>
          </div>

          {/* Personal Info Section */}
          <div className="mb-8 pb-8 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Personal Information</h2>
            <input
              placeholder="Full Name"
              className="w-full mb-4 p-3 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:border-blue-500 focus:outline-none placeholder-gray-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
            <input
              placeholder="PAN Number"
              className="w-full p-3 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:border-blue-500 focus:outline-none placeholder-gray-500"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Risk Profiling Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">Risk Profiling Questions</h2>
            <p className="text-gray-400 mb-6">Answer all 7 questions to determine your investment profile</p>

            {questions && questions.length > 0 ? (
              questions.map((q) => (
                <div key={q.id} className="mb-6 pb-6 border-b border-gray-700 last:border-b-0">
                  <p className="font-semibold text-white mb-3">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm mr-2">
                      Q{q.id}
                    </span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options && q.options.map((opt, idx) => (
                      <label
                        key={idx}
                        className="flex items-center p-3 border border-gray-600 rounded-lg hover:bg-gray-700 cursor-pointer bg-gray-750 transition"
                      >
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          checked={answers[q.id] === (typeof opt === "string" ? idx : opt.score)}
                          onChange={() =>
                            handleAnswer(q.id, typeof opt === "string" ? idx : opt.score)
                          }
                          className="w-4 h-4 cursor-pointer"
                          disabled={submitting}
                        />
                        <span className="ml-3 text-gray-300">
                          {typeof opt === "string" ? opt : opt.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No questions available. Please refresh the page.</p>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="mb-8 p-4 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">
              Answered: <span className="font-bold text-blue-400">{Object.keys(answers).length}</span> / 7 questions
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length !== 7}
            className={`w-full font-bold py-3 rounded-lg transition ${
              submitting || Object.keys(answers).length !== 7
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg"
            }`}
          >
            {submitting ? "Submitting..." : "✓ Submit & Continue to Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Kyc;
