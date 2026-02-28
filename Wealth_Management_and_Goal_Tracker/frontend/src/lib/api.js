const BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000'

async function request(path, opts = {}) {
    const res = await fetch(BASE + path, opts)
    const text = await res.text()
    try { return { status: res.status, body: JSON.parse(text) } }
    catch { return { status: res.status, body: text } }
}

export function register(data) {
    return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
}

export function login(data) {
    return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
}

export function refresh(body) {
    return request('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
}

export function me(token) {
    return request('/users/me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

export function getRiskQuestions() {
    return request('/risk/questions')
}

export function submitRisk(answers, token, notes) {
    return request('/users/me/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ answers, notes })
    })
}

export function setKyc(status, token) {
    return request('/users/me/kyc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ kyc_status: status })
    })
}

// --- GOALS API ---
export function getGoals(token) {
    return request('/goals/', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

export function createGoal(goal, token) {
    return request('/goals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(goal)
    })
}

export function deleteGoal(id, token) {
    return request(`/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

// --- PORTFOLIO API ---
export function getHoldings(token) {
    return request('/portfolio/holdings', { headers: { 'Authorization': `Bearer ${token}` } })
}

export function getTransactions(token) {
    return request('/portfolio/transactions', { headers: { 'Authorization': `Bearer ${token}` } })
}

export function createTransaction(data, token) {
    return request('/portfolio/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    })
}

// ADDED: Rebalance Suggestions API call
export function getRebalanceSuggestions(token) {
    return request('/portfolio/rebalance-suggestions', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

// --- SIMULATIONS API ---
export function getSimulations(token) {
    return request('/simulations/', { headers: { 'Authorization': `Bearer ${token}` } })
}

export function createSimulation(data, token) {
    return request('/simulations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
    })
}

export function deleteSimulation(id, token) {
    return request(`/simulations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

export async function getDashboardSummary(token) {
    return request('/dashboard/summary', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
}

export default { 
    register, login, refresh, me, 
    getRiskQuestions, submitRisk, setKyc, 
    getGoals, createGoal, deleteGoal,
    getHoldings, getTransactions, createTransaction,
    getRebalanceSuggestions, // ADDED here
    getSimulations, createSimulation, deleteSimulation, getDashboardSummary
}