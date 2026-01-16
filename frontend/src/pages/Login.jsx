import React, { useState } from 'react'
import api from '../lib/api'

export default function Login({ onLoggedIn, onRegisterClick }){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState(null)
  const [loading,setLoading]=useState(false)

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const res = await api.login({ email, password })
    setLoading(false)
    if(res.status===200){
      const tok = res.body.access_token
      localStorage.setItem('access_token', tok)
      localStorage.setItem('refresh_token', res.body.refresh_token)
      setMsg('Login successful!')
      setTimeout(() => onLoggedIn && onLoggedIn(tok), 500)
    } else setMsg(JSON.stringify(res.body))
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-gray-100">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 text-center">Welcome Back</h2>
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              placeholder="you@example.com" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              placeholder="••••••••" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 transform transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {msg && <div className={`text-sm mt-4 text-center p-2 rounded ${msg.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{msg}</div>}

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={onRegisterClick} className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Sign up
          </button>
        </div>
      </div>
    </div>
  )
}
