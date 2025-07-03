import requests
import getpass
import os

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
    if res.status_code == 200:
        print("✅ Signup successful! Please login.")
    else:
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

    if res.status_code == 200:
        token = res.json()["token"]
        print("✅ Login successful!")
        return token
    else:
        print(f"❌ Login failed with status {res.status_code}")
        print("Response text:", res.text)
        return None

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

    print(f"🔎 Status Code: {res.status_code}")
    try:
        response_data = res.json()
        if res.ok:
            print("✅ Upload successful:", response_data)
        else:
            print("❌ Upload failed:", response_data)
    except requests.exceptions.JSONDecodeError:
        print("❌ Upload failed: Response is not valid JSON")
        print("Response text:", res.text)

def view_alerts(token):
    print("\n🚨 YOUR ALERTS")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/alerts", headers=headers)

    if res.ok:
        alerts = res.json()
        if alerts:
            for alert in alerts:
                print(f"- [{alert['severity']}] {alert['type']}: {alert['message']}")
        else:
            print("✅ No alerts.")
    else:
        print("❌ Failed to fetch alerts:", res.text)

# def view_dashboard(token):
#     print("\n📊 YOUR DASHBOARD")
#     headers = {"Authorization": f"Bearer {token}"}
#     res = requests.get(f"{BASE_URL}/dashboard", headers=headers)

#     if res.ok:
#         data = res.json()
#         print(f"📦 Current Demand       : {data['current_demand']}")
#         print(f"📦 Inventory Position   : {data['inventory_position']}")
#         print(f"📦 Weeks of Supply      : {data['weeks_of_supply']}")
#         print(f"⏰ Last Updated         : {data['timestamp']}")
#     else:
#         print("❌ Failed to fetch dashboard:", res.text)

def view_dashboard(token):
    print("\n📊 YOUR DASHBOARD")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/dashboard", headers=headers)

    if res.ok:
        data = res.json()
        print(f"📦 Current Demand        : {data['current_demand']}")
        print(f"📦 Inventory Position    : {data['inventory_position']}")
        print(f"📦 Weeks of Supply       : {data['weeks_of_supply']}")
        print(f"🚫 Stockouts             : {data['stockouts']}")
        print(f"📉 % SKUs Below ROP      : {data['percent_below_rop']}%")
        print(f"🕓 Last Updated          : {data['last_updated']}")
        print("🏬 Store-wise Inventory:")
        for store, qty in data['store_wise_stock'].items():
            print(f"   - {store}: {qty} units")
    else:
        print("❌ Failed to fetch dashboard:", res.text)


def main():
    while True:
        print("\n==== Inventory Maintainer ====")
        choice = input("Do you want to (1) Signup or (2) Login? (Enter 1 or 2): ").strip()

        if choice == "1":
            signup()
        elif choice == "2":
            token = login()
            if token:
                while True:
                    print("\n📋 Choose an action:")
                    print("1️⃣  Upload CSV")
                    print("2️⃣  View Alerts")
                    print("3️⃣  View Dashboard")
                    print("4️⃣  Logout")
                    action = input("Enter your choice (1-4): ").strip()

                    if action == "1":
                        upload_csv(token)
                    elif action == "2":
                        view_alerts(token)
                    elif action == "3":
                        view_dashboard(token)
                    elif action == "4":
                        print("👋 Logged out.")
                        break
                    else:
                        print("❌ Invalid choice.")
        else:
            print("❌ Invalid input. Enter 1 or 2.")

if __name__ == "__main__":
    main()
