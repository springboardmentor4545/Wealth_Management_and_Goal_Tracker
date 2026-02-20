import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { riskQuestions } from "../data/riskQuestions";
import { toast } from "react-toastify";

export default function Profile() {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
      navigate("/");
      return;
    }

    if (user?.profile_completed) {
      toast.info("Profile already completed ✅");
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };


  const handleContinue = () => {
    for (let q of riskQuestions) {
      if (answers[q.id] === undefined) {
        setError("Please answer all risk profile questions");
        return;
      }
    }
    setError("");
    setStep(2); 
  };

  
  const handleSubmit = async () => {
    try {
      setError("");

      if (answers["kyc_verified"] === undefined) {
        setError("Please select your KYC status");
        return;
      }

      const payload = { answers };
      const res = await api.post("/user/risk-profile", payload);

      const user = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...user,
          profile_completed: res.data.profile_completed,
          risk_profile: res.data.risk_profile,
          kyc_status: res.data.kyc_status,
        })
      );

      toast.success("Profile successfully completed 🎉");
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      console.error(err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to submit");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-6 pb-6 ">
      <div className="w-full max-w-3xl bg-white p-10 pt-6 rounded-xl shadow-[0px_6px_11px_0px_rgba(0,0,0,0.8)] border border-gray-300">
        
        <h1 className="text-3xl font-bold text-blue-700 text-center mb-1">
          Wealth Management
        </h1>
        <p className="text-center text-gray-500 text-sm mb-4">
          Securely manage your financial goals
        </p>

        
        <h2 className="text-xl font-semibold mb-6 text-left">
          {step === 1 ? "Risk Profiling Questionnaire" : "KYC Status"}
        </h2>

       
        {error && (
          <div className="mb-6 text-red-700 bg-red-100 border border-red-300 p-3 rounded text-center">
            {error}
          </div>
        )}

        {/* ================= STEP 1: RISK QUESTIONS ================= */}
        {step === 1 && (
          <>
            {riskQuestions.map((q) => (
              <div
                key={q.id}
                className="mb-6 border border-blue-500 rounded-lg p-4 bg-blue-50"
              >
                <p className="font-normal mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, idx) => (
                    <label
                      key={idx}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="accent-blue-600"
                        onChange={() => handleChange(q.id, opt.score)}
                        checked={answers[q.id] === opt.score}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-center mt-8">
              <button
                onClick={handleContinue}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* ================= STEP 2: KYC FORM ================= */}
        {step === 2 && (
          <>
            
            <div className="mb-6 border border-blue-500 rounded-lg p-4 bg-blue-50">
              <p className="font-normal mb-3">
                Is your KYC status verified?
              </p>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kyc"
                    className="accent-blue-600"
                    onChange={() => handleChange("kyc_verified", 1)}
                    checked={answers["kyc_verified"] === 1}
                  />
                  <span>Yes, KYC is verified</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="kyc"
                    className="accent-blue-600"
                    onChange={() => handleChange("kyc_verified", 0)}
                    checked={answers["kyc_verified"] === 0}
                  />
                  <span>No, KYC is not verified</span>
                </label>
              </div>
            </div>

            <div className="flex justify-center mt-8 gap-4">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition"
              >
                Back
              </button>

              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Submit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
