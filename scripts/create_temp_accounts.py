import json
import urllib.request
import sys
import time

ts = int(time.time())
landlord_email = f"copilot.temp.landlord+{ts}@test.example"
seeker_email = f"copilot.temp.seeker+{ts}@test.example"
password = "TempPass123!"

def post_json(url, payload, headers=None):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers or {'Content-Type':'application/json'})
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

base = 'https://home-finder-api.onrender.com'

print('Registering landlord', landlord_email)
status, body = post_json(f"{base}/api/auth/register", {"FullName":"Copilot Temp Landlord","Email":landlord_email,"Password":password,"Role":"Landlord"})
print('STATUS', status)
print(body)
try:
    res = json.loads(body)
    landlord_token = res.get('AccessToken') or res.get('accessToken')
except Exception:
    landlord_token = None

print('\nRegistering seeker', seeker_email)
status2, body2 = post_json(f"{base}/api/auth/register", {"FullName":"Copilot Temp Seeker","Email":seeker_email,"Password":password,"Role":"Renter"})
print('STATUS', status2)
print(body2)

if landlord_token:
    print('\nCreating listing with landlord token...')
    listing = {"Title":"Temp Listing from Copilot","Description":"Test listing created by temp landlord","Type":"Apartment","Address":"123 Test St","City":"Buea","Region":"South West","Country":"Cameroon","PricePerNight":15000,"Currency":"XAF","Bedrooms":2,"Bathrooms":1,"MaxGuests":3,"Amenities":["WiFi","Parking"]}
    headers = {'Content-Type':'application/json','Authorization':f'Bearer {landlord_token}'}
    s3, b3 = post_json(f"{base}/api/listings", listing, headers=headers)
    print('STATUS', s3)
    print(b3)
else:
    print('\nNo landlord token obtained; cannot create listing.')

print('\nDone')
