import requests

BASE_URL = "http://localhost:8000"

def test_upload():
    # Login first
    login_data = {"username": "Ajay", "password": "password123"} # Assuming Ajay exists now
    # If Ajay doesn't exist/work, I'll sign up a new temp user
    
    username = "upload_tester"
    password = "UploadPass123!"
    
    requests.post(f"{BASE_URL}/auth/signup", json={"username": username, "email": "upload@test.com", "password": password})
    resp = requests.post(f"{BASE_URL}/auth/token", data={"username": username, "password": password})
    
    if resp.status_code != 200:
        print("Login failed")
        return

    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'data', 'test_data.csv')
    files = {'file': ('test_data.csv', open(file_path, 'rb'), 'text/csv')}
    
    print("Uploading file...")
    try:
        r = requests.post(f"{BASE_URL}/analytics/analyze-file", headers=headers, files=files)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print("Response:", r.json())
        else:
            print("Error:", r.text)
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    test_upload()
