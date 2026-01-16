import json
from urllib import request, error

BASE = 'http://127.0.0.1:8000'

def post(path, data):
    url = BASE + path
    data_bytes = json.dumps(data).encode('utf-8')
    req = request.Request(url, data=data_bytes, headers={'Content-Type':'application/json'})
    try:
        with request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode('utf-8')
            return resp.getcode(), body
    except error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return None, str(e)


def main():
    user = {"email": "tester@example.com", "password": "secret123"}

    print('Registering user...')
    code, body = post('/auth/register', user)
    print('Register status:', code)
    print(body)

    print('\nLogging in...')
    code, body = post('/auth/login', user)
    print('Login status:', code)
    print(body)

    try:
        data = json.loads(body)
        access = data.get('access_token')
        if access:
            print('\nCalling protected /users/me...')
            req = request.Request(BASE + '/users/me', headers={'Authorization': f'Bearer {access}'})
            with request.urlopen(req, timeout=10) as r:
                print('Protected status:', r.getcode())
                print(r.read().decode())
    except Exception:
        pass


if __name__ == '__main__':
    main()
