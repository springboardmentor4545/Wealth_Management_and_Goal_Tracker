import React, { useState, useEffect } from 'react'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import RiskProfile from './pages/RiskProfile'
import Goals from './pages/Goals'
import Portfolio from './pages/Portfolio'
import api from './lib/api'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  // If we have a token, default to profile, otherwise login
  const [view, setView] = useState(localStorage.getItem('access_token') ? 'profile' : 'login')

  useEffect(()=>{
    if(token) localStorage.setItem('access_token', token)
    else localStorage.removeItem('access_token')
  },[token])

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        {view==='register' && <Register onRegistered={(u)=>{ setView('login') }} onLoginClick={()=>setView('login')} />}
        {view==='login' && <Login onLoggedIn={(tok)=>{ setToken(tok); setView('profile') }} onRegisterClick={()=>setView('register')} />}
        {view==='profile' && <Profile token={token} onLogout={()=>{ setToken(null); setView('login') }} onRiskClick={()=>setView('risk')} onGoalsClick={()=>setView('goals')} onPortfolioClick={()=>setView('portfolio')} />}
        {view==='risk' && <RiskProfile token={token} onBack={()=>setView('profile')} />}
        {view==='goals' && <Goals token={token} onBack={()=>setView('profile')} />}
        {view==='portfolio' && <Portfolio token={token} onBack={()=>setView('profile')} />}
    </div>
  )
}
