import requests

BASE = 'http://127.0.0.1:8000'

email = 'samar@example.com'
passw = 'TestPass123!'

print('Registering...')
r = requests.post(BASE + '/auth/register', json={'email': email, 'password': passw})
print(r.status_code, r.text)

print('Logging in...')
r = requests.post(BASE + '/auth/login', json={'email': email, 'password': passw})
print(r.status_code, r.text)
if r.status_code != 200:
    raise SystemExit('login failed')

tokens = r.json()
access = tokens.get('access_token')
print('Access token:', access[:20] + '...')

print('Fetching current user...')
r = requests.get(BASE + '/users/me', headers={'Authorization': f'Bearer {access}'})
print(r.status_code, r.text)

# prepare answers: pick first choice (0) for all questions
q_resp = requests.get(BASE + '/risk/questions')
print('questions status', q_resp.status_code)
questions = q_resp.json().get('questions', [])
answers = [q['choices'][0]['value'] for q in questions]

print('Submitting risk...')
r = requests.post(BASE + '/users/me/risk', json={'answers': answers, 'notes': 'test'}, headers={'Authorization': f'Bearer {access}'})
print(r.status_code, r.text)

print('Fetching user after risk submit...')
r = requests.get(BASE + '/users/me', headers={'Authorization': f'Bearer {access}'})
print(r.status_code, r.text)
