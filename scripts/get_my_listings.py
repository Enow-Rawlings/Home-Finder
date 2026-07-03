import json, urllib.request
base='https://home-finder-api.onrender.com'
ld = json.load(open('landlord_response.json'))
token = ld.get('AccessToken') or ld.get('accessToken') or ld.get('access_token')
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
req = urllib.request.Request(f"{base}/api/listings/mine", headers=headers, method='GET')
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        status = resp.getcode()
        body = resp.read().decode('utf-8')
except Exception as e:
    try:
        status = e.code
        body = e.read().decode('utf-8')
    except Exception:
        status = None
        body = str(e)
open('mine_saved.json', 'w', encoding='utf-8').write(json.dumps({'status': status, 'body': body}))
print('STATUS', status)
print(body)
