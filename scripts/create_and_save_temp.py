import json, urllib.request, time

base = 'https://home-finder-api.onrender.com'
ts = int(time.time())
landlord_email = f'copilot.temp.landlord+{ts}@test.example'
seeker_email = f'copilot.temp.seeker+{ts}@test.example'
password = 'TempPass123!'

def post_json(url, payload, headers=None):
    data = json.dumps(payload).encode('utf-8')
    hdrs = {'Content-Type':'application/json'}
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.getcode()
            body = resp.read().decode('utf-8')
            return status, body
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode('utf-8')
        except Exception:
            body = str(e)
        return e.code, body
    except Exception as e:
        return None, str(e)

# Register landlord
landlord_payload = { 'FullName': 'Copilot Temp Landlord', 'Email': landlord_email, 'Password': password, 'Role': 'Landlord' }
status1, body1 = post_json(f'{base}/api/auth/register', landlord_payload)
open('landlord_saved.json', 'w', encoding='utf-8').write(json.dumps({ 'status': status1, 'body': body1 }))
print('Landlord register', status1)

# Register seeker
seeker_payload = { 'FullName': 'Copilot Temp Seeker', 'Email': seeker_email, 'Password': password, 'Role': 'Renter' }
status2, body2 = post_json(f'{base}/api/auth/register', seeker_payload)
open('seeker_saved.json', 'w', encoding='utf-8').write(json.dumps({ 'status': status2, 'body': body2 }))
print('Seeker register', status2)

# Extract token from landlord response if possible
landlord_token = None
try:
    resp1 = json.loads(body1)
    landlord_token = resp1.get('AccessToken') or resp1.get('accessToken') or resp1.get('access_token')
    open('landlord_response.json', 'w', encoding='utf-8').write(json.dumps(resp1))
except Exception:
    open('landlord_response.json', 'w', encoding='utf-8').write(body1)

# Attempt listing create
create_status = None
create_body = None
if landlord_token:
    listing = { 'Title': 'Temp Listing from Copilot', 'Description': 'Test listing', 'Type': 'Apartment', 'Address': '123 Test St', 'City': 'Buea', 'Region': 'South West', 'Country': 'Cameroon', 'PricePerNight': 15000, 'Currency': 'XAF', 'Bedrooms': 2, 'Bathrooms': 1, 'MaxGuests': 3, 'Amenities': ['WiFi'] }
    status3, body3 = post_json(f'{base}/api/listings', listing, headers={'Authorization': f'Bearer {landlord_token}'})
    create_status, create_body = status3, body3
    open('create_saved.json', 'w', encoding='utf-8').write(json.dumps({ 'status': create_status, 'body': create_body }))
    print('Create listing', create_status)
else:
    print('No landlord token; skipping listing create')

print('Done')
