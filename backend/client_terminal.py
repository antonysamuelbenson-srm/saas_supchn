import requests
import getpass
import os
import json, uuid
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
from app.routes import forecast_data

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("ANON_KEY")
supabase: Client = create_client(url, key)

from pathlib import Path

BASE_URL = "http://127.0.0.1:5000"

def signup():
    print("\n🔐 SIGNUP")
    email = input("Enter email: ").strip()
    password = getpass.getpass("Enter password: ").strip()

    data = {
        "email": email,
        "password": password
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
        return None, None

def fetch_permissions(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        resp = requests.get(F"{BASE_URL}/user/permissions", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("role"), set(data.get("allowed_routes", []))
        else:
            print("Failed to fetch permissions:", resp.text)
            return None, set()
    except Exception as e:
        print("Error fetching permissions:", str(e))
        return None, set()
    
def upload_csv(token: str) -> None:
    """
    Flexible uploader.
    The user picks which CSV(s) to upload each time:
      1 = Store master
      2 = Inventory snapshot
      3 = Forecast
    They can choose one, several comma‑separated, or 'd' to quit.
    """
    file_types = {
        "1": ("store master"      , "store"),
        "2": ("inventory snapshot", "inventory"),
        "3": ("forecast"          , "forecast"),
        "4": ("uploadStoreData"        , "totalStoreData"),
        "5": ("TransferCostData     " , "transferCostData"),
        "6": ("WarehouseMaxCapacityDataUpload", "warehouseMaxData")
    }

    headers = {"Authorization": f"Bearer {token}"}

    while True:
        print("\n➡️  Select file(s) to upload:")
        for k, (label, _) in file_types.items():
            print(f"  {k}. {label}")
        print("  d. Done / return to menu")

        choice = input("Enter number(s) (e.g. 1,2) or d: ").strip().lower()
        if choice == "d":
            print("👍 Upload finished.")
            break

        selections = [c.strip() for c in choice.split(",") if c.strip() in file_types]
        if not selections:
            print("❌ Invalid selection.")
            continue

        for key in selections:
            label, route = file_types[key]
            path = input(f"Path to {label} CSV: ").strip()
            if not path:
                print("⏭️  Skipped.")
                continue
            if not os.path.exists(path):
                print("❌ File does not exist. Skipped.")
                continue

            print(f"📤 Uploading {path} …")
            with open(path, "rb") as fh:
                res = requests.post(
                    f"{BASE_URL}/api/upload/{route}",
                    files={"file": fh},
                    headers=headers,
                    timeout=60,
                )
            if res.ok:
                print("   ✅ Success")
            else:
                print(f"   ❌ Failed ({res.status_code})")
                try:
                    print("   ", res.json())
                except Exception:
                    print("   ", res.text)

def update_store_info(hdr):
    import requests

    # Fetch all stores
    try:
        res = requests.get(f"{BASE_URL}/stores", headers=hdr)
        stores = res.json().get("stores", []) if res.ok else []

        if not stores:
            print("🚫 No stores.")
            return

        print("\n🏪 TARGET STORES")
        for i, s in enumerate(stores, 1):
            print(f"{i}. {s['name']} ({s['city']})")

        choice = input("\nEnter the number of the store you want to edit: ").strip()
        if not choice.isdigit() or int(choice) < 1 or int(choice) > len(stores):
            print("❌ Invalid choice.")
            return

        selected_store = stores[int(choice) - 1]
    except Exception as e:
        print(f"❌ Failed to fetch stores: {e}")
        return

    print("\n📝 Press Enter to keep the current value.\n")

    fields = [
        ("store_code", "Store code"),
        ("name", "Store name"),
        ("lat", "Latitude"),
        ("lon", "Longitude"),
        ("address", "Address"),
        ("city", "City"),
        ("state", "State"),
        ("country", "Country"),
        ("capacity_units", "Capacity"),
    ]

    payload = {"store_id": selected_store.get("store_id")}
    for key, label in fields:
        old_val = selected_store.get(key, "")
        new_val = input(f"{label} [{old_val}]: ").strip()
        if new_val:
            if key in ["lat", "lon", "capacity_units"]:
                try:
                    payload[key] = float(new_val)
                except ValueError:
                    print(f"⚠️ Invalid number for {label}, skipping.")
            else:
                payload[key] = new_val

    if len(payload) == 1:  # only store_id is present
        print("❌ No changes provided.")
        return

    try:
        r = requests.post(f"{BASE_URL}/update_store", headers=hdr, json=payload, timeout=15)
        if r.ok:
            print("✅ Store updated successfully.")
        else:
            print("❌ Failed to update store:", r.text)
    except Exception as e:
        print(f"❌ Error occurred: {e}")

def recompute_availability_rate(token):
                headers = {"Authorization": f"Bearer {token}"}
                url = f"{BASE_URL}/availability/recompute"
                response = requests.post(url, headers=headers)

                if response.ok:
                    print("✅", response.json()["message"])
                else:
                    print("❌ Recompute failed:", response.text)


def settings_menu(token: str):
    hdr = {"Authorization": f"Bearer {token}"}

    while True:
        print("\n🛠️  SETTINGS MENU")
        print("1. Set Forecast Formula")
        print("2. Set Lead Times")
        print("3. Set Forecast Lookahead")
        print("4. Update Store Location")
        print("5. Recalculate & Update Dashboard KPIs")
        print("6. Recompute weekly availability")
        print("7. Back to Main Menu")

        choice = input("Choose an option: ").strip()

        if choice == "1":
            fm = requests.get(f"{BASE_URL}/config/formulas", headers=hdr).json()
            print("\n📐  FORMULAS")
            for i, (k, v) in enumerate(fm.items(), 1):
                print(f"{i}. {k:<12} {v}")
            try:
                f_idx = int(input("Formula #: ").strip()) - 1
                formula_key = list(fm.keys())[f_idx]
                stores = requests.get(f"{BASE_URL}/stores", headers=hdr).json().get("stores", [])
                if not stores:
                    print("🚫 No stores.")
                    continue
                print("\n🏪 TARGET STORES")
                for i, s in enumerate(stores, 1):
                    print(f"{i}. {s['name']} ({s['city']})")
                print("A. ALL stores")
                sel = input("Select A or 1,3: ").strip().lower()
                payload = {"formula": formula_key}
                if sel != "a":
                    try:
                        idxs = [int(x)-1 for x in sel.split(",")]
                        payload["store_ids"] = [stores[i]["store_id"] for i in idxs]
                    except Exception:
                        print("❌ Invalid selection")
                        continue
                r = requests.post(f"{BASE_URL}/config/apply-formula", headers=hdr, json=payload)
                print(r.json() if r.ok else r.text)

            except Exception:
                print("❌ Invalid formula selection")
                continue

        elif choice == "2":
            set_lead_times(token)

        elif choice == "3":
            lookahead = input("Enter forecast lookahead (in days): ").strip()
            if not lookahead.isdigit():
                print("❌ Invalid input. Must be a number.")
                continue
            response = requests.post(
                f"{BASE_URL}/config/set-lookahead-days",
                headers=hdr,
                json={"lookahead_days": int(lookahead)}
            )
            if response.ok:
                print("✅ Lookahead updated successfully.")
            else:
                print("❌ Failed to set lookahead:", response.text)
        elif choice == "4":
            update_store_info(hdr)
        elif choice == "5":
            response = requests.post(f"{BASE_URL}/dashboard/recompute", headers=hdr)
            if response.ok:
                print("✅ Dashboard KPIs recalculated and saved.")
            else:
                print("❌ Failed to recalculate dashboard:", response.text)
        elif choice=="6":
            recompute_availability_rate(token)
        elif choice == "7":
            break
        else:
            print("❌ Invalid choice.")

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

def refresh_alerts(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/alerts/refresh", headers=headers)
    if res.ok:
        print(f"🔄 Inserted {res.json()['inserted']} alerts.")
    else:
        print("❌ Failed to refresh alerts:", res.text)


def view_dashboard(token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/dashboard", headers=headers)

    print("\n📊 Dashboard (Latest from DB + Live Demand):")
    if res.ok:
        try:
            data = res.json()
            print(f"  🔹 Current Demand         : {data.get('current_demand')}")
            print(f"  🔹 Inventory Position     : {data.get('inventory_position')}")
            print(f"  🔹 Weeks of Supply        : {data.get('weeks_of_supply')}")
            print(f"  🔹 Projected Stockouts    : {data.get('projected_stockouts')}")
            print(f"  🔹 Fill Rate Probability  : {data.get('fill_rate_probability')}%")
            print(f"  🕓 Timestamp              : {data.get('timestamp')}")

            # Forecast note if available
            forecast_msg = data.get("forecast_msg")
            if forecast_msg:
                print(f"\n📝 Forecast Note: {forecast_msg}")

        except Exception:
            print("❌ Error parsing dashboard response.")
            print(res.text)
    else:
        print("❌ Failed to fetch dashboard.")
        try:
            print(res.json())
        except Exception:
            print(res.text)



def add_store(token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "store_code":  input("Code : ").strip(),
        "name"      :  input("Name : ").strip(),
        "address"   :  input("Address : ").strip(),
        "city"      :  input("City : ").strip(),
    }
     # ── optional (hit Enter to skip) ───────────────────────
    opt_fields = {
        "state"          : "State   [optional]: ",
        "country"        : "Country [optional]: ",
        "lat"            : "Lat     [optional]: ",
        "long"           : "Long    [optional]: ",
        "capacity_units" : "Capacity[optional]: ",
    }
    for key, prompt in opt_fields.items():
        val = input(prompt).strip()
        if val:                       # only include if user typed something
            payload[key] = val
    r = requests.post(f"{BASE_URL}/store_upload",
                      headers=headers, json=payload, timeout=20)
    print("Status: ",r.status_code)
    try:
        print("Payload:", r.json())        # ✅ works when server truly returns JSON
    except ValueError:                     # ⬅️ catches non‑JSON bodies
        print("Raw response:", r.text)


def view_store_summary(token):
    hdr = {"Authorization": f"Bearer {token}"}

    # STEP 1 – fetch all stores
    r = requests.get(f"{BASE_URL}/stores", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ failed:", r.text); return

    stores = r.json().get("stores", [])
    if not stores:
        print("🙅  No stores found."); return

    # present a menu
    print("\n📍 Stores:")
    for i, s in enumerate(stores, 1):
        print(f"{i}. {s['name']} ({s['city']}) – {s['sku_total']} SKUs, "
              f"{s['alert_total']} alerts")

    try:
        idx = int(input("Select store #: ")) - 1
        store_id = stores[idx]["store_id"]
    except Exception:
        print("🚫 invalid choice"); return

    # STEP 2 – fetch that store’s summary
    r = requests.get(f"{BASE_URL}/store/{store_id}/summary", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ failed:", r.text); return

    # pretty‑print result
    import json, textwrap
    print(textwrap.indent(json.dumps(r.json(), indent=2), prefix="   "))


def view_hovered_store_stats(token):
    hdr = {"Authorization": f"Bearer {token}"}

    # Fetch store list to pick from
    r = requests.get(f"{BASE_URL}/stores", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ Failed to fetch stores:", r.text)
        return

    stores = r.json().get("stores", [])
    if not stores:
        print("🙅 No stores found.")
        return

    print("\n📍 Select a store to hover over:")
    for i, s in enumerate(stores, 1):
        print(f"{i}. {s['name']} ({s['city']})")

    try:
        idx = int(input("Select store #: ").strip()) - 1
        store_id = stores[idx]["store_id"]
    except Exception:
        print("🚫 Invalid choice.")
        return

    r = requests.get(f"{BASE_URL}/store/{store_id}/hover", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ Failed to fetch hovered store stats:", r.text)
        return

    data = r.json()
    print("\n🧭 Hovered Store Stats:")
    print(f"  🔸 Distinct SKUs      : {data.get('distinct_skus')}")
    print(f"  📦 Inventory Units    : {data.get('inventory_units')}")
    print(f"  📈 Forecast (7 days)  : {data.get('forecast_units')}")
    print(f"  ⚠️ Alerts count  : {data.get('alerts')}")



def set_lead_times(token):
    hdr = {"Authorization": f"Bearer {token}"}

    r = requests.get(f"{BASE_URL}/stores", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ Failed to fetch stores:", r.text)
        return

    stores = r.json().get("stores", [])
    if not stores:
        print("🙅 No stores found.")
        return

    print("\n🕒 Enter lead time (in days) for each store. Leave blank to use default (7 days):\n")
    lead_times = []

    for store in stores:
        store_id = store["store_id"]
        name = store.get("name", "Unnamed Store")

        val = input(f"Store: {name} (ID: {store_id}) - Lead Time: ")
        try:
            lead_time = int(val) if val.strip() else None
        except ValueError:
            print("⚠️ Invalid input. Defaulting to 7 days.")
            lead_time = None

        if lead_time is not None:
            lead_times.append({"store_id": store_id, "lead_time": lead_time})
        else:
            lead_times.append({"store_id": store_id})  # default will be used by backend

    response = requests.post(
        f"{BASE_URL}/config/update-lead-times", 
        json={"lead_times": lead_times},
        headers=hdr
    )

    if response.status_code == 200:
        print("\n✅ Lead times updated successfully.\n")
    else:
        print(f"\n❌ Failed to update lead times: {response.json()}\n")


def view_store_alerts(token): #all stores' alert status together
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(f"{BASE_URL}/stores/with-alert-status", headers=headers)
        if response.status_code == 200:
            store_alerts = response.json()
            if not store_alerts:
                print("✅ No stores found with alert status.")
                return

            print("\n🚨 Store Alert Status:")
            for store in store_alerts:
                print("\n🚨 Store Alert:\n")
                print(json.dumps(store, indent=4))

                # Optionally print individual fields if they exist
                print(f"   Store ID: {store.get('store_id', 'N/A')}")
                print(f"   SKUs to Reorder: {store.get('num_skus_to_reorder', 'N/A')}")
                print(f"   Stockouts Despite Reorder: {store.get('num_skus_stockout_despite_reorder', 'N/A')}")
                print(f"   Alert Present: {'⚠️ YES' if store.get('alert', False) else '✅ NO'}")

        else:
            print(f"❌ Failed to fetch alert status: {response.status_code}")
            print(response.json())

    except requests.exceptions.RequestException as e:
        print("❌ Error connecting to server:", str(e))

def get_store_alert_status(token):
    hdr = {"Authorization": f"Bearer {token}"}
     # STEP 1 – fetch all stores
    r = requests.get(f"{BASE_URL}/stores", headers=hdr, timeout=20)
    if not r.ok:
        print("❌ failed:", r.text); return

    stores = r.json().get("stores", [])
    if not stores:
        print("🙅  No stores found."); return

    # present a menu
    print("\n📍 Stores:")
    for i, s in enumerate(stores, 1):
        print(f"{i}. {s['name']} ({s['city']}) – {s['sku_total']} SKUs, "
              f"{s['alert_total']} alerts")

    try:
        idx = int(input("Select store #: ")) - 1
        store_id = stores[idx]["store_id"]
    except Exception:
        print("🚫 invalid choice"); return
    
    url = f"{BASE_URL}/store/{store_id}/with-alert-status"
    response = requests.get(url, headers=hdr)
    response.raise_for_status()
    # return response.json()
    data = response.json()

    print(f"\n📦 Store Alert Summary")
    print(f"🔢 Store ID: {data['store_id']}")
    print(f"📦 SKUs to Reorder: {data['num_skus_to_reorder']}")
    print(f"⚠️ Stockouts Despite Reorder: {data['num_skus_stockout_despite_reorder']}")
    print(f"🚨 Alert Active: {'Yes' if data['alert'] else 'No'}")

    print("DEBUG: Raw response:", response.text)


def view_forecast_data(token):
    """
    Shows forecasted data: User chooses a store from `/stores`,
    then fetches forecast per SKU for that store and specified days.
    """
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch stores from `/stores`
    res = requests.get(f"{BASE_URL}/stores", headers=headers)
    if not res.ok:
        print("❌ Failed to fetch stores:", res.text)
        return

    stores = res.json().get("stores", [])
    if not stores:
        print("🚫 No stores found.")
        return

    print("\n🏪 Available Stores:")
    for idx, store in enumerate(stores, 1):
        print(f"{idx}. {store['name']} ({store['city']}) "
              f"[SKUs: {store['sku_total']}, Alerts: {store['alert_total']}]")

    try:
        choice = int(input("\nSelect a store #: ").strip())
        if choice < 1 or choice > len(stores):
            raise ValueError
    except ValueError:
        print("❌ Invalid selection.")
        return

    store_id = stores[choice - 1]["store_id"]
    store_name = stores[choice - 1]["name"]

    # Ask for lookahead days
    try:
        days = int(input("📆 Enter number of days to forecast (e.g., 7, 15, 30): ").strip())
        if days <= 0:
            raise ValueError
    except ValueError:
        print("❌ Invalid number of days. Defaulting to 7.")
        days = 7

    # Fetch forecast data for this store and days
    res = requests.get(f"{BASE_URL}/forecast/store/{store_id}?days={days}", headers=headers)
    if not res.ok:
        print("❌ Failed to fetch forecast:", res.text)
        return

    forecast_data = res.json().get("forecast", {})
    if not forecast_data:
        print("📉 No forecast data found for this store.")
        return

    print(f"\n📊 Forecast Data for Store: {store_name} (next {days} days)")
    for sku, entries in forecast_data.items():
        print(f"\nSKU: {sku}")
        for entry in entries:
            print(f"  {entry['date']} → Qty: {entry['forecast_qty']}")


def admin_privileges(token):
    headers = {"Authorization": f"Bearer {token}"}

    def fetch_users():
        res = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        if not res.ok:
            print("❌ Failed to fetch users")
            return []
        try:
            return res.json()
        except Exception as e:
            print("❌ Failed to parse user list:", str(e))
            return []
        
    def fetch_deactivated(status=None):
        url = f"{BASE_URL}/admin/users"
        if status:
            url += f"?status={status}"
        res = requests.get(url, headers=headers)
        if not res.ok:
            print("❌ Failed to fetch users")
            return []
        try:
            return res.json()
        except Exception as e:
            print("❌ Failed to parse user list:", str(e))
            return []


    def select_user(users):
        print("\n👥 Available Users:")
        for i, user in enumerate(users):
            status = "🟢 Active" if user.get("active", True) else "🔴 Deactivated"
            print(f"{i + 1}. Email: {user['email']} | Role: {user['role']} | Status: {status} | ID: {user['role_user_id']}")
        try:
            choice = int(input("\nSelect user number: "))
            if not (1 <= choice <= len(users)):
                print("❌ Invalid selection.")
                return None
            return users[choice - 1]
        except ValueError:
            print("❌ Please enter a valid number.")
            return None

    def change_user_role():
        users = fetch_users()
        if not users:
            return
        selected_user = select_user(users)
        if not selected_user:
            return

        role_user_id = selected_user['role_user_id']
        print(f"👉 Selected: {selected_user['email']}")

        new_role = input("Enter new role (e.g., admin, viewer): ")
        res = requests.put(
            f"{BASE_URL}/admin/user/{role_user_id}/role",
            headers=headers,
            json={"role": new_role}
        )
        try:
            print("🔄 Response:", res.json())
        except Exception:
            print("❌ Failed to parse response:", res.text)

    def delete_user():
        users = fetch_users()
        if not users:
            return
        selected_user = select_user(users)
        if not selected_user:
            return

        role_user_id = selected_user['role_user_id']
        print(f"🗑️ Deleting: {selected_user['email']}")

        res = requests.delete(
            f"{BASE_URL}/admin/user/{role_user_id}",
            headers=headers
        )
        try:
            print("✅ Response:", res.json())
        except Exception:
            print("❌ Failed to parse response:", res.text)

    def deactivate_user():
        users = fetch_users()
        if not users:
            return
        selected_user = select_user(users)
        if not selected_user:
            return

        role_user_id = selected_user['role_user_id']
        print(f"⛔ Deactivating: {selected_user['email']}")

        res = requests.post(
            f"{BASE_URL}/admin/user/{role_user_id}/deactivate",
            headers=headers
        )
        try:
            print("✅ Response:", res.json())
        except Exception:
            print("❌ Failed to parse response:", res.text)
    
    def reactivate_user():
        users = fetch_deactivated(status="deactivated")
        if not users:
            return
        selected_user = select_user(users)
        if not selected_user:
            return

        role_user_id = selected_user['role_user_id']
        print(f"✅ Reactivating: {selected_user['email']}")

        res = requests.post(
            f"{BASE_URL}/admin/user/{role_user_id}/reactivate",
            headers=headers
        )
        try:
            print("✅ Response:", res.json())
        except Exception:
            print("❌ Failed to parse response:", res.text)


    while True:
        print("\n--- Admin Privileges ---")
        print("1. Change a user's role")
        print("2. Delete a user")
        print("3. Deactivate a user")
        print("4. Reactivate a user")
        print("5. Back to main menu")

        choice = input("Enter your choice: ")

        if choice == "1":
            change_user_role()
        elif choice == "2":
            delete_user()
        elif choice == "3":
            deactivate_user()
        elif choice == "4":
            reactivate_user()
        elif choice == "5":
            break
        else:
            print("Invalid choice. Please try again.")


def place_reorder(token):
    headers = {"Authorization": f"Bearer {token}"}

    # STEP 0 – Use today's date as snapshot_date
    snapshot_date = date.today().isoformat()

    # STEP 1 – fetch reorder suggestions
    res = requests.get(
        f"{BASE_URL}/reorder/generate",
        headers=headers,
        params={"snapshot_date": snapshot_date}
    )
    if not res.ok:
        print("❌ Failed to fetch reorder suggestions.")
        print(res.status_code, res.text)  # helpful for debugging
        return

    data = res.json()

    reorder_items = []
    print("\n📦 REORDER SUGGESTIONS")
    for i, item in enumerate(data, 1):
        store_id = item["store_id"]
        sku = item["sku"]
        qty = item["qty"]
        lead_time = item["lead_time_days"]
        product = item.get("product_name", sku)  # fallback if name not present

        print(f"{i}. 📍 Store ID {store_id} | {sku} – {product} | Qty: {qty} | Lead time: {lead_time}")

        reorder_items.append({
            "index": i,
            "store_id": store_id,
            "sku": sku,
            "qty": qty,
            "lead_time_days": lead_time
        })


    if not reorder_items:
        print("✅ No SKUs need reorder.")
        return

    # STEP 2 – Ask user which to reorder
    print("\n👉 Enter comma-separated item numbers to reorder (or 'a' for all, 's' to skip):")
    user_input = input("Selection: ").strip().lower()

    if user_input == "s":
        print("❌ No items selected for reorder.")
        return
    elif user_input == "a":
        final_items = reorder_items
    else:
        try:
            selected_indexes = set(map(int, user_input.split(",")))
            final_items = [item for item in reorder_items if item["index"] in selected_indexes]
        except Exception:
            print("❌ Invalid input.")
            return

    if not final_items:
        print("⚠️ No valid reorder items selected.")
        return


    reorder_payload = {
        "reorder_date": date.today().isoformat(),
        "items": [
            {
                "store_id": item["store_id"],
                "sku": item["sku"],
                "qty": item["qty"],
                "lead_time_days": item["lead_time_days"]
            }
            for item in final_items
        ]
    }

    # STEP 3 – post reorder request
    res = requests.post(f"{BASE_URL}/reorder/place", headers=headers, json=reorder_payload)
    if res.ok:
        print("✅ Reorder placed successfully.")
    else:
        print("❌ Failed to place reorder:", res.text)

def display_availability_from_db(token):
    url = f"{BASE_URL}/availability"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)

    if response.ok:
        data = response.json()["data"]
        print("\n📊 WEEKLY AVAILABILITY RATE")
        for item in data:
            print(f"Week starting {item['week_start']}: {item['availability_rate']}%")
    else:
        print("❌ Failed to fetch availability data:", response.text)



MENU_OPTIONS = {
    "1": {"desc": "Upload CSV (validate + ingest)", "route": "POST:/store_upload"},
    "2": {"desc": "Refresh & View Alerts", "route": "POST:/alerts/refresh"},
    "3": {"desc": "View Dashboard (live demand + saved KPIs)", "route": "GET:/dashboard"},
    "4": {"desc": "View one Store Summary", "route": "GET:/store/<int:store_id>/summary"},
    "5": {"desc": "Settings (change formula)", "route": "POST:/config/apply-formula"},
    "6": {"desc": "Add Store", "route": "POST:/update_store"},
    "7": {"desc": "Hovered Store Stats", "route": "GET:/store/<int:store_id>/hover"},
    "8": {"desc": "Check Stockouts After Reorder(store alert on map)", "route": "POST:/alerts/check-stockout-after-reorder"},
    "9": {"desc": "Individual store map alert", "route": "GET:/stores/with-alert-status"},
    "10": {"desc": "Show Forecasted Data", "route": "GET:/forecast/store/<int:store_id>"},
    "11": {"desc": "Admin Privileges", "route": "GET:/admin/users"},  # Admin-only example
    "12": {"desc": "Logout", "route": None},
    "13": {"desc": "Place Reorder", "route": "POST:/reorder/place"},
    "14": {
    "desc": "View Weekly Availability Rate",
    "route": "GET:/availability"
}


}

def normalize_route(route):
    # Replace all <...> segments with <param> to match your ROUTE_ROLE_MAP style
    import re
    if not route:
        return route
    return re.sub(r"<[^>]+>", "<param>", route)

def show_menu(allowed_routes):
    print("\n==== Available Actions ====")
    normalized_allowed = {normalize_route(r) for r in allowed_routes}

    for key, opt in MENU_OPTIONS.items():
        route = opt["route"]
        if route is None:
            print(f"{key}. {opt['desc']}")
            continue

        norm_route = normalize_route(route)
        if norm_route in normalized_allowed:
            print(f"{key}. {opt['desc']}")


def main():
    while True:
        print("\n==== Inventory Maintainer ====")
        choice = input("Do you want to (1) Signup or (2) Login? (Enter 1 or 2): ").strip()

        if choice == "1":
            signup()
        elif choice == "2":
            token, role_user_id = login()
            if token:
                user_role, allowed_routes = fetch_permissions(token)
                if not allowed_routes:
                    print("\n⛔ Your account is deactivated or has no permissions.")
                    return

            if token:
                while True:
                    show_menu(allowed_routes)
                    action = input("Enter your choice: ").strip()

                    if action not in MENU_OPTIONS:
                        print("❌ Invalid choice.")
                        continue

                    if action == "12":  # Logout
                        print("👋 Logged out.")
                        break
                    
                    route = MENU_OPTIONS[action]["route"]
                    if route:
                        norm_route = normalize_route(route)
                        if norm_route not in {normalize_route(r) for r in allowed_routes}:
                            print("❌ You don't have permission for this action.")
                            continue


                    # action = input("Enter your choice: ").strip()
                    if action == "1":
                        upload_csv(token)
                    elif action == "2":
                        refresh_alerts(token)
                        view_alerts(token)
                    elif action == "3":
                        view_dashboard(token)
                    elif action == "4":
                        view_store_summary(token)
                    elif action=="5":
                        settings_menu(token)
                    elif action=="6":
                        add_store(token)
                    elif action == "7":
                        view_hovered_store_stats(token)
                    elif action == "8":
                        view_store_alerts(token)
                    elif action == "9":
                        get_store_alert_status(token)
                    elif action == "10":
                        view_forecast_data(token)
                    elif action == "11":
                        admin_privileges(token)
                    elif action == "12":
                        print("👋 Logged out.")
                        break
                    elif action == "13":
                        place_reorder(token)
                    elif action=="14":
                        display_availability_from_db(token)

                    else:
                        print("❌ Invalid choice.")
        else:
            print("❌ Invalid input. Enter 1 or 2.")


if __name__ == "__main__":
    main()
