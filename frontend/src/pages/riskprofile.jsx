import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import axios from "axios";

export default function RiskProfile() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/auth/risk-profile/questions")
      setQuestions(res.data)
    } catch (err) {
      toast.error("Failed to load assessment")
    } finally {
      setLoading(false)
    }
  }

  const selectOption = (score) => {
    const qId = questions[currentStep].id
    setAnswers({ ...answers, [qId]: score })

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300)
    }
  }

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Please answer all questions")
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        "http://127.0.0.1:8000/api/v1/auth/risk-profile/submit",
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("profile_completed", "true")
      toast.success("Assessment Complete!")
      setShowModal(true)
    } catch (err) {
      toast.error("Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>
      <p className="text-white relative z-10">Loading assessment...</p>
    </div>
  )

  const currentQ = questions[currentStep]

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative font-sans text-white">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-xl">
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 space-y-8 shadow-2xl">
          {/* Progress Indicator */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Assessment</p>
                <h2 className="text-2xl font-bold">Calibration</h2>
              </div>
              <span className="text-slate-400 text-sm font-medium">{currentStep + 1} / {questions.length}</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-xl font-medium mb-6 leading-relaxed">{currentQ?.question}</h1>
            <div className="grid grid-cols-1 gap-3">
              {currentQ?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => selectOption(opt.score)}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 ${answers[currentQ.id] === opt.score
                    ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20"
                    : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/20"
                    }`}
                >
                  <span className="text-sm font-medium">{opt.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="text-slate-500 text-xs font-bold hover:text-white disabled:opacity-0 transition-colors uppercase tracking-widest"
            >
              Back
            </button>

            {currentStep === questions.length - 1 && (
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
              >
                {submitting ? "Processing..." : "Submit Profile"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/90 border border-white/10 p-10 rounded-[2.5rem] max-w-sm w-full space-y-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-white text-2xl font-bold">Calibration Complete</h2>
                <p className="text-slate-400 text-sm leading-relaxed">Your risk profile is set. Next, we need a simple confirmation to verify your identity.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {localStorage.getItem("kyc_status") === "verified" ? (
                <button onClick={() => navigate("/dashboard")} className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold text-white text-sm transition-all shadow-lg shadow-blue-600/20">Go to Dashboard</button>
              ) : (
                <>
                  <button onClick={() => navigate("/kyc")} className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl font-bold text-white text-sm transition-all shadow-lg shadow-blue-600/20">Verify Identity</button>
                  <button onClick={() => navigate("/dashboard")} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl font-bold text-slate-400 text-sm transition-all border border-white/5">I'll do it later</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
