import React, { useEffect, useState } from 'react'
import api from '../lib/api'

export default function RiskProfile({ token, onBack }){
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(()=>{
    api.getRiskQuestions().then(r=>{
      if(r.status===200) setQuestions(r.body.questions || [])
      else setErr('Could not load questions')
    }).catch(e=>setErr(String(e)))
  },[])

  function setAnswer(qid, val){
    setAnswers(prev=>({ ...prev, [qid]: val }))
  }

  async function handleSubmit(e){
    e.preventDefault()
    if(!token) return setErr('Not authenticated')
    const list = questions.map(q=>answers[q.id] ?? 0)
    setSubmitting(true)
    const res = await api.submitRisk(list, token, notes)
    setSubmitting(false)
    if(res.status===200){
      onBack && onBack()
    } else {
      setErr(JSON.stringify(res.body))
    }
  }

  return (
    <div className="py-6 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">Risk Assessment</h2>
            <button type="button" onClick={onBack} className="text-white hover:bg-white/20 px-3 py-1 rounded transition-colors text-sm">Cancel</button>
          </div>
          
      <div className="p-8">
        {err && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-lg text-sm">{err}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-8">
            {questions.length===0 && <div className="text-center py-10 text-gray-500">Loading questions...</div>}
            
            {questions.map((q, idx)=> (
            <div key={q.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="font-semibold text-gray-800 mb-3 flex gap-2">
                    <span className="text-blue-600">{idx+1}.</span>
                    {q.text}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {q.choices.map(c=> (
                    <label key={c.value} className={`
                        cursor-pointer border p-3 rounded-md transition-all flex items-center justify-between
                        ${answers[q.id] === c.value 
                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                            : 'bg-white border-gray-200 hover:border-blue-300'}
                    `}>
                    <span className="text-sm font-medium text-gray-700">{c.label}</span>
                    <input 
                        className="sr-only" 
                        type="radio" 
                        name={`q-${q.id}`} 
                        value={c.value} 
                        onChange={()=>setAnswer(q.id, c.value)} 
                        checked={answers[q.id] === c.value}
                    />
                    {answers[q.id] === c.value && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                    </label>
                ))}
                </div>
            </div>
            ))}

            <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    rows="3"
                    placeholder="Any specific constraints or goals..."
                    value={notes} 
                    onChange={e=>setNotes(e.target.value)} 
                />
            </div>

            <div className="flex gap-4 pt-4">
                <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transform transition-transform active:scale-95 disabled:opacity-50"
                >
                    {submitting ? 'Analyzing Profile...' : 'Submit Assessment'}
                </button>
                <button type="button" onClick={onBack} className="px-6 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors">
                    Back
                </button>
            </div>
        </form>
      </div>
      </div>
    </div>
  )
}
