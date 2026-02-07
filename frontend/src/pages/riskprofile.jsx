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
      toast.error("Failed to load questions")
    } finally {
      setLoading(false)
    }
  }

  const selectOption = (score) => {
    const qId = questions[currentStep].id
    setAnswers({ ...answers, [qId]: score })

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 400)
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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1)_0%,transparent_50%)]"></div>
      <div className="relative z-10 space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Loading Assessment</p>
      </div>
    </div>
  )

  const currentQ = questions[currentStep]

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative font-sans text-white overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)]"></div>

      <div className="relative w-full max-w-2xl animate-in fade-in zoom-in duration-700">
        <div className="glass-card p-12 border-white/10 space-y-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50"></div>

          {/* Progress Indicator */}
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Investment Setup</p>
                <h2 className="text-3xl font-black tracking-tight">Risk Assessment</h2>
              </div>
              <span className="text-slate-500 text-xs font-black tabular-nums tracking-widest">{currentStep + 1} / {questions.length}</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div key={currentStep} className="animate-in fade-in slide-in-from-right-8 duration-500">
            <h1 className="text-2xl font-black mb-10 leading-tight tracking-tight text-slate-100">{currentQ?.question}</h1>
            <div className="grid grid-cols-1 gap-4">
              {currentQ?.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => selectOption(opt.score)}
                  className={`group p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${answers[currentQ.id] === opt.score
                    ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/30"
                    : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.98]"
                    }`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`text-sm font-black uppercase tracking-wider ${answers[currentQ.id] === opt.score ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{opt.text}</span>
                    {answers[currentQ.id] === opt.score && (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-white/5">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="text-slate-500 text-[10px] font-black hover:text-white disabled:opacity-0 transition-all uppercase tracking-[0.2em] flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Go Back
            </button>

            {currentStep === questions.length - 1 && (
              <button
                onClick={submit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 transition-all hover:scale-105 active:scale-95"
              >
                {submitting ? "Processing..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="glass-card bg-[#0f172a] border-white/10 p-12 rounded-[3rem] max-w-md w-full space-y-10 text-center shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-700">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

            <div className="space-y-6">
              <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border border-blue-600/20 shadow-[0_0_30px_rgba(37,99,235,0.15)] relative group">
                <div className="absolute inset-0 bg-blue-600/20 rounded-full animate-ping opacity-20"></div>
                <svg className="w-12 h-12 text-blue-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-white text-3xl font-black tracking-tight">Assessment Complete</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed px-4">Your risk profile is set. Next, please verify your identity to unlock all features.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {localStorage.getItem("kyc_status") === "verified" ? (
                <button onClick={() => navigate("/dashboard")} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/30 active:scale-95">Go to Dashboard</button>
              ) : (
                <>
                  <button onClick={() => navigate("/kyc")} className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black text-white text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-blue-600/30 active:scale-95">Verify Identity</button>
                  <button onClick={() => navigate("/dashboard")} className="w-full bg-white/5 hover:bg-white/10 p-5 rounded-2xl font-black text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-[0.3em] transition-all border border-white/5">I'll do it later</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
