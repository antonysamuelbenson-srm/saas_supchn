import requests
import getpass
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("ANON_KEY")
supabase: Client = create_client(url, key)

BASE_URL = "http://127.0.0.1:5000"

def signup():
    print("\n🔐 SIGNUP")
    email = input("Enter email: ").strip()
    password = getpass.getpass("Enter password: ").strip()
    role = input("Enter role (admin/planner): ").strip()

    data = {
        "email": email,
        "password": password,
        "role": role
    }

    res = requests.post(f"{BASE_URL}/register", json=data)
    if res.ok:
        print("✅ Signup successful! Please login.")
    else:
        try:
            print("❌ Signup failed:", res.json())
        except Exception:
            print("❌ Signup failed:", res.text)

def login():
    print("\n🔓 LOGIN")
    email = input("Enter email: ").strip()
    password = getpass.getpass("Enter password: ").strip()

    data = {
        "email": email,
        "password": password
    }

    res = requests.post(f"{BASE_URL}/login", json=data)

    if res.ok:
        token = res.json()["token"]
        role_user_id = res.json().get("role_user_id") 
        print("✅ Login successful!")
        return token, role_user_id
    else:
        print(f"❌ Login failed with status {res.status_code}")
        try:
            print("Response:", res.json())
        except Exception:
            print("Response:", res.text)
        return None,None

def upload_csv(token):
    print("\n📤 UPLOAD CSV")
    file_path = input("Enter path to your CSV file: ").strip()

    if not os.path.exists(file_path):
        print("❌ File does not exist.")
        return

    with open(file_path, "rb") as f:
        files = {"file": f}
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.post(f"{BASE_URL}/upload/validate", files=files, headers=headers)

    if res.ok:
        print("✅ CSV uploaded successfully.")
        try:
            print(res.json())
        except Exception:
            print(res.text)
        # 🔷 Automatically move to formula selection
        choose_formula(token)
    else:
        try:
            print("❌ Upload failed:", res.json())
        except Exception:
            print("❌ Upload failed:", res.text)

def choose_formula(token):
    print("\n📐 CHOOSE FORMULA FOR REORDER CALCULATION")

    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/config/formulas", headers=headers)

    if not res.ok:
        print("❌ Failed to fetch formulas.")
        try:
            print(res.json())
        except Exception:
            print(res.text)
        return

    formulas = res.json()
    print("\nAvailable formulas:")
    for i, (key, formula) in enumerate(formulas.items(), start=1):
        print(f"{i}. {key}: {formula}")

    choice = input("Enter choice number: ").strip()

    try:
        choice_idx = int(choice) - 1
        selected_formula = list(formulas.keys())[choice_idx]
    except Exception:
        print("❌ Invalid choice.")
        return

    # Apply chosen formula
    payload = {"formula": selected_formula}
    res = requests.post(f"{BASE_URL}/config/apply-formula", json=payload, headers=headers)

    if res.ok:
        print("✅ Formula applied & thresholds + alerts updated!")
        try:
            print(res.json())
        except Exception:
            print(res.text)
    else:
        print("❌ Failed to apply formula. Status:", res.status_code)
        try:
            print(res.json())
        except Exception:
            print(res.text)

def view_alerts(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/alerts", headers=headers)
    print("\n📋 Alerts:")
    if res.ok:
        try:
            for alert in res.json():
                print(alert)
        except Exception:
            print(res.text)
    else:
        print("❌ Failed to fetch alerts.")
        print(res.text)

def view_dashboard(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/dashboard", headers=headers)
    print("\n📊 Dashboard:")
    if res.ok:
        try:
            print(res.json())
        except Exception:
            print(res.text)
    else:
        print("❌ Failed to fetch dashboard.")
        print(res.text)

def add_store(token,role_user_id):
    store_name = input("Enter name of your store: ")
    store_location = input("Enter location of store: ")
    
    print(store_name,store_location)


    response = (
        supabase.table("stores")
        .insert({"store_name" : store_name, "location" : store_location,
            "role_user_id": role_user_id })
        .execute()
    )

# def add_store(token):
#     headers = {"Authorization": f"Bearer {token}"}
#     res = requests.get(f"{BASE_URL}/store_upload", headers=headers)
#     print("done")

def view_store_summary(token):
    print("\n🏪 Store-wise Summary:")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/store/summary", headers=headers)

    if res.ok:
        data = res.json()
        if not data:
            print("No store data available.")
            return
        for store, items in data.items():
            print(f"\n📦 Store: {store}")
            for item in items:
                print(f"  🔸 SKU: {item['sku']}")
                print(f"     Product Name : {item.get('product_name')}")
                print(f"     Quantity     : {item.get('quantity')}")
                print(f"     Avg Daily    : {item.get('avg_daily_usage')}")
                print(f"     Lead Time    : {item.get('lead_time_days')}")
                print(f"     Safety Stock : {item.get('safety_stock')}")
                print(f"     Reorder Point: {item.get('reorder_point')}")
    else:
        print("❌ Failed to fetch store summary.")
        try:
            print(res.json())
        except:
            print(res.text)


def main():
    while True:
        print("\n==== Inventory Maintainer ====")
        choice = input("Do you want to (1) Signup or (2) Login? (Enter 1 or 2): ").strip()

        if choice == "1":
            signup()
        elif choice == "2":
            token,role_user_id = login()
            if token:
                while True:
                    print("\n📋 Choose an action:")
                    print("1️1  Upload CSV (will also ask formula & generate alerts)")
                    print("2️2  View Alerts")
                    print("3️3  View Dashboard")
                    print("3️4  Add Store")
                    print("  5  View Store Summary")
                    print("4️6  Logout")

                    action = input("Enter your choice: ").strip()
                    if action == "1":
                        upload_csv(token)
                    elif action == "2":
                        view_alerts(token)
                    elif action == "3":
                        view_dashboard(token)
                    elif action == "4":
                        add_store(token,role_user_id)
                    elif action == "5":
                        view_store_summary(token)
                    elif action == "6":
                        print("👋 Logged out.")
                        break
                    else:
                        print("❌ Invalid choice.")
        else:
            print("❌ Invalid input. Enter 1 or 2.")

if __name__ == "__main__":
    main()