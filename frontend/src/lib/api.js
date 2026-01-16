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

export default { register, login, refresh, me, getRiskQuestions, submitRisk, setKyc }
