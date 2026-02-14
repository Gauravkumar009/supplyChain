import requests
import json

BASE_URL = "http://localhost:8000"

def inspect_response():
    # Login first to get token
    login_data = {"username": "Ajay", "password": "password123"} # Adjust credential if needed
    # Wait, the user just created a NEW account. 
    # I don't know the new user's credentials. 
    # But wait, I can try to hit the endpoints. 
    # Oh, the endpoints are protected: `current_user: schemas.User = Depends(security.get_current_user)`.
    # I need a valid token.
    # I'll try to signup a *temporary* user for debugging purposes.
    
    username = "debug_user_1"
    password = "debug_password"
    email = "debug1@example.com"
    
    # Signup
    requests.post(f"{BASE_URL}/auth/signup", json={"username": username, "email": email, "password": password})
    
    # Login
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": username, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code}")
        print(resp.text)
        return
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- PRODUCTS ---")
    try:
        r = requests.get(f"{BASE_URL}/products", headers=headers)
        if r.status_code == 200:
            data = r.json()
            print(f"Count: {len(data)}")
            if data:
                print("First Product keys:", data[0].keys())
                print("First Product sample:", json.dumps(data[0], indent=2))
        else:
            print("Failed to fetch products:", r.status_code)
    except Exception as e:
        print(e)
        
    print("\n--- ORDERS ---")
    try:
        r = requests.get(f"{BASE_URL}/orders", headers=headers)
        if r.status_code == 200:
            data = r.json()
            print(f"Count: {len(data)}")
            if data:
                print("First Order keys:", data[0].keys())
                print("First Order sample:", json.dumps(data[0], indent=2))
        else:
            print("Failed to fetch orders:", r.status_code)
    except Exception as e:
        print(e)

if __name__ == "__main__":
    inspect_response()
