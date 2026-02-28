import React, { useState } from 'react'
import api from '../lib/api'

export default function Register({ onRegistered, onLoginClick }){
  const [email,setEmail]=useState('')
  const [username,setUsername]=useState('')
  const [password,setPassword]=useState('')
  const [msg,setMsg]=useState(null)
  const [loading,setLoading]=useState(false)

  async function submit(e){
    e.preventDefault()
    
    // Password validation regex: 
    // ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
    // at least one lowercase, one uppercase, one digit, one special char, min 8 chars
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
    if(!strongPasswordRegex.test(password)){
        setMsg("Password must be at least 8 chars, include 1 uppercase, 1 lowercase, 1 number, and 1 special char.")
        return
    }

    setLoading(true)
    setMsg(null)
    const res = await api.register({ email, username, password })
    setLoading(false)
    if(res.status===200){ setMsg('Registered — please login'); setTimeout(()=>onRegistered && onRegistered(res.body), 1000); }
    else setMsg(JSON.stringify(res.body))
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-8 border border-gray-100">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 text-center">Create Account</h2>
        
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              placeholder="Username" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              required
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              placeholder="you@example.com" 
              type="email"
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        {msg && <div className={`text-sm mt-4 text-center p-2 rounded ${msg.includes('Registered') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{msg}</div>}

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={onLoginClick} className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
