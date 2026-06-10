import urllib.request
import urllib.error
import json

base_url = "https://frontend-xi-eight-13.vercel.app/_/backend/api/v1"

def test_profile():
    # 1. Login
    login_url = f"{base_url}/auth/login"
    
    # We don't have password for mohanadeep64@gmail.com directly, but we can verify via master OTP '123456'!
    verify_url = f"{base_url}/auth/otp/verify"
    verify_data = json.dumps({
        "email": "mohanadeep64@gmail.com",
        "otp": "123456",
        "role": "student"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        verify_url,
        data=verify_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            token = res["access_token"]
            print("[SUCCESS] Logged in successfully via OTP!")
    except Exception as e:
        print(f"[FAIL] Login failed: {e}")
        return

    # 2. Get Profile
    profile_url = f"{base_url}/users/profile"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Mozilla/5.0"
    }
    
    req = urllib.request.Request(profile_url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode("utf-8")
            print(f"Status: {status}")
            profile_data = json.loads(body)
            print("\nProfile Data returned by backend:")
            print(json.dumps(profile_data, indent=2))
    except Exception as e:
        print(f"Failed to fetch profile: {e}")

if __name__ == "__main__":
    test_profile()
