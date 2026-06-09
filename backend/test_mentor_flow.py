import urllib.request
import urllib.error
import json

base_url = "https://frontend-xi-eight-13.vercel.app/_/backend/api/v1"

def test_flow():
    # 1. Login
    login_url = f"{base_url}/auth/login"
    login_data = json.dumps({
        "email": "challagollasridevi@gmail.com",
        "password": "mentor123456"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            token = res["access_token"]
            print("[SUCCESS] Logged in successfully!")
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        return

    # Endpoints for mentor
    endpoints = {
        "getAppStatus": "/mentors/application-status",
        "getMySessions": "/mentors/sessions/me",
        "getPendingSubmissions": "/projects/submissions/pending"
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0"
    }

    for name, endpoint in endpoints.items():
        url = f"{base_url}{endpoint}"
        print(f"\nTesting {name} ({url})...")
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req) as response:
                status = response.getcode()
                body = response.read().decode("utf-8")
                print(f"[{name}] Status: {status}")
                data = json.loads(body)
                print(f"[{name}] Returned: {len(data) if isinstance(data, list) else 'Object'}")
        except urllib.error.HTTPError as e:
            print(f"[{name}] HTTP Error {e.code}: {e.reason}")
            print(f"[{name}] Response: {e.read().decode('utf-8')}")
        except Exception as e:
            print(f"[{name}] Error: {e}")

if __name__ == "__main__":
    test_flow()
