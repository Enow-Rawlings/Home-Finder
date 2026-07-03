import json, urllib.request

base='https://home-finder-api.onrender.com'
ld = json.load(open('landlord.json'))
# Token keys may be lower or camelCase
token = ld.get('AccessToken') or ld.get('accessToken') or ld.get('access_token')
print('Token present:', bool(token))

payload = {"Title":"Minimal Test","City":"Buea","PricePerNight":10000}

def post(url, body, token=None):
    data = json.dumps(body).encode('utf-8')
    headers = {'Content-Type':'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.getcode(), resp.read().decode()
    except urllib.error.HTTPError as e:
        try:
            return e.code, e.read().decode()
        except:
            return e.code, str(e)
    except Exception as e:
        return None, str(e)

status, body = post(f"{base}/api/listings", payload, token)
print('STATUS', status)
print(body)
