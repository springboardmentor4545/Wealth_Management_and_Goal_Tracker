import React, { useEffect, useState } from 'react'
import api from '../lib/api'

export default function Profile({ token, onLogout, onRiskClick }){
  const [user, setUser] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(()=>{
    if(!token) return setErr('Not logged in')
    api.me(token).then(r=>{
      if(r.status===200) setUser(r.body)
      else setErr(JSON.stringify(r.body))
    }).catch(e=>setErr(String(e)))
  },[token])

  if(!token) return (
    <div className="text-center mt-10">
      <div className="text-red-600 font-bold mb-4">Not logged in</div>
      <button onClick={onLogout} className="text-blue-500 underline">Go to Login</button>
    </div>
  )

  if (!user && !err) return <div className="p-8 text-center text-gray-500">Loading profile...</div>

  return (
    <div className="bg-gray-50 min-h-full pb-10">
      {/* Navbar / Top Bar */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center mb-6 rounded-lg">
        <h1 className="text-xl font-bold text-gray-800">My Dashboard</h1>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.email}</span>
            <button 
                onClick={()=>{ localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); onLogout && onLogout() }}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
                Logout
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {err && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{err}</div>}
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-extrabold mb-2">Welcome, {user?.username || 'User'} !!!</h2>
                <p className="text-blue-100">Here is your financial overview and profile status.</p>
            </div>
            {/* Decorative circle */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Profile Card */}
            <div 
                onClick={!user?.profile_completed ? onRiskClick : undefined}
                className={`p-6 rounded-xl border border-gray-100 shadow-sm bg-white transition-all ${!user?.profile_completed ? 'cursor-pointer hover:shadow-md hover:border-blue-300 group' : ''}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Risk Profile Analysis</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${user?.profile_completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {user?.profile_completed ? 'Completed' : 'Action Required'}
                    </span>
                </div>
                
                {user?.profile_completed ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                             <div className="text-2xl font-bold text-indigo-600">{user.risk_category}</div>
                             <span className="text-gray-400 text-sm">({user.risk_score} pts)</span>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-3 rounded-lg flex items-center gap-2 text-green-700 font-medium text-sm">
                            <span className="text-lg">✓</span> KYC Verified
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            Allocation: {user.allocation}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-4">You haven't completed your risk assessment yet.</p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-blue-200 group-hover:bg-blue-700 transition-colors">
                            Complete Risk Profile (7 Qs)
                        </button>
                    </div>
                )}
            </div>

            {/* Account Details Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Account Details</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">User ID</span>
                        <span className="font-medium">{user?.id}</span>
                    </div>
                    {/* <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Username</span>
                        <span className="font-medium">{user?.username || 'Not Set'}</span>
                    </div> */}
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Profile Status</span>
                         <span className="font-medium text-gray-700">{user?.profile_completed ? 'Active' : 'Pending'}</span>
                    </div>
                     <div className="mt-4 pt-2">
                        <span className="text-gray-500 block mb-1">Notes</span>
                        <p className="text-gray-700 bg-gray-50 p-2 rounded italic text-xs">
                            {user?.profile_notes || 'No notes added.'}
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}
