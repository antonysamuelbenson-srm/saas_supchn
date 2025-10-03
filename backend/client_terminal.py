import requests
import getpass
import os
import json
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
from io import StringIO
import csv
from tabulate import tabulate

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("ANON_KEY")
supabase: Client = create_client(url, key)

from pathlib import Path

BASE_URL = "http://127.0.0.1:5500"

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
            lookahead = input("Enter forecast lookahead (in weeks): ").strip()
            if not lookahead.isdigit():
                print("❌ Invalid input. Must be a number.")
                continue
            response = requests.post(
                f"{BASE_URL}/user/lookahead_days",
                headers=hdr,
                json={"weeks": int(lookahead)}
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
    "11": {"desc": "Admin Privileges", "route": "GET:/admin/users"},
    "12": {"desc": "Logout", "route": None},
    "13": {"desc": "Place Reorder", "route": "POST:/reorder/place"},
    "14": {"desc": "View Weekly Availability Rate", "route": "GET:/availability"},
    "15": {
        "desc": "Forecast",
        "route" : None,
        "submenu": {
            "1": {"desc": "Set Forecast Schedule", "route": "POST:/forecast/schedule"},
            "2": {"desc": "Update Forecast Horizon", "route": "POST:/forecast/schedule/horizon"},
            "3": {"desc": "View Forecast Schedules", "route": "GET:/forecast/schedule"},
            "4": {"desc": "Manual Forecast Runner", "route": "POST:/forecast/run"},
            "5": {"desc": "Store-level Forecast (Next N Weeks)", "route": "GET:/forecast/store-level"},
            "6": {"desc": "Store-level Past Accuracy", "route": "GET:/forecast/accuracy/store"},
            "7": {"desc": "SKU-level Forecast (Next N Weeks)", "route": "GET:/forecast/sku-level"},
            "8": {"desc": "SKU-level Past Accuracy", "route": "GET:/forecast/accuracy/sku"},
            "9": {"desc": "Forecast Chart Data", "route": "GET:/forecast/chart-data"},
            "10": {"desc": "Weekly forecasts", "route": "POST:/forecast/weekly"},
            "11": {"desc": "Forecast Run Logs", "route": "GET:/forecast/logs"}
        }
    },
    "16": {"desc": "Rebalancer", "route": "POST:/api/rebalance"},
    "17": {"desc": "Inventory Levels Filter", "route": "GET:/store_inventory_summary"},
    "18": {
        "desc": "Weeks of Supply Analysis",
        "route": None,
        "submenu": {
            "1": {"desc": "View Store Summary", "route": "GET:/api/weeks-of-supply/store-summary"},
            "2": {"desc": "Refresh Weeks of Supply Data", "route": "POST:/api/weeks-of-supply/refresh"},
            "3": {"desc": "Back to Main Menu", "route": None}
        }
    },
    "19": {
    "desc": "Demand Trend Analysis",
    "route": None,
    "submenu": {
        "1": {"desc": "View Store Summary", "route": "GET:/api/demand-trend/store-summary"},
        "2": {"desc": "Refresh Demand Trend Data", "route": "POST:/api/demand-trend/refresh"},
        "3": {"desc": "Back to Main Menu", "route": None}
    }
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


def forecast_menu(token):

    def view_forecast_schedule():
        url = f"{BASE_URL}/forecast/schedule"
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(url, headers=headers)
        print(r.json())

    def set_forecast_schedule():
        url = f"{BASE_URL}/forecast/schedule"
        headers = {"Authorization": f"Bearer {token}"}

        # Optional store/product
        store_id = input("Enter store ID [leave blank for all stores]: ").strip() or None
        product_id = input("Enter product ID [leave blank for all products]: ").strip() or None

        # Frequency selection
        valid_frequencies = ["hourly", "daily", "weekly", "monthly"]
        while True:
            frequency = input(f"Select frequency {valid_frequencies}: ").strip().lower()
            if frequency in valid_frequencies:
                break
            print("Invalid frequency, choose from the options above.")

        # Optional time/day
        time_of_day = input("Enter time of day (HH:MM) [default 00:00]: ").strip() or "00:00"
        day_of_week = input("Enter day of week [default Saturday]: ").strip() or "Saturday"

        payload = {
            "store_id": store_id,
            "product_id": product_id,
            "frequency": frequency,
            "time_of_day": time_of_day,
            "day_of_week": day_of_week
        }

        r = requests.post(url, json=payload, headers=headers)
        print(r.json())


    def update_forecast_horizon():
        url = f"{BASE_URL}/forecast/schedule/horizon"
        headers = {"Authorization": f"Bearer {token}"}

        # Prompt user for n_days
        while True:
            n_days_input = input("Enter forecast horizon in days (e.g., 7): ").strip()
            if n_days_input.isdigit() and int(n_days_input) > 0:
                n_days = int(n_days_input)
                break
            print("Please enter a valid positive integer for n_weeks.")

        payload = {"n_weeks": n_days}

        r = requests.post(url, json=payload, headers=headers)
        print(r.json())

    def run_forecast():
        url = f"{BASE_URL}/run"
        headers = {"Authorization": f"Bearer {token}"}

        # ask user for input
        try:
            weeks_input = input("Enter number of weeks for forecast [default 4]: ").strip()
            weeks = int(weeks_input) if weeks_input else 4
        except ValueError:
            print("❌ Invalid input. Please enter an integer.")
            return

        payload = {"weeks": weeks}

        try:
            r = requests.post(url, headers=headers, json=payload)
            r.raise_for_status()
            print(r.json())
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")


    def chart_data():
        url = f"{BASE_URL}/forecast/chart-data"
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(url, headers=headers)
        print(r.json())

    def store_level_forecast():
        url = f"{BASE_URL}/forecast/store-level"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"n_weeks": 4}
        r = requests.get(url, headers=headers, params=params)
        print(r.json())


    def sku_level_forecast():
        url = f"{BASE_URL}/forecast/sku-level"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"n_weeks": 4}
        r = requests.get(url, headers=headers, params=params)
        print(r.json())

    def past_accuracy_sku(token):
        url = f"{BASE_URL}/forecast/accuracy/sku"
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(url, headers=headers)
        if r.ok:
            data = r.json()
            print("\n📊 SKU Forecast Accuracy:")
            for row in data:
                sku = row.get('sku') or "Unknown"
                week_start = row.get('week_start') or "Unknown"
                bias = row.get('bias')
                wmape = row.get('wmape')
                mae = row.get('mae')
                actuals = row.get('actuals')
                predicted = row.get('predicted')

                print(
                    f"📦 SKU: {sku} | "
                    f"📅 Week Start: {week_start} | "
                    f"🎯 Bias: {bias:.2f}% | "
                    f"📉 WMAPE: {wmape:.2f}% | "
                    f"📏 MAE: {mae:.2f} | "
                    f"🟢 Actuals: {actuals:.2f} | "
                    f"🔵 Predicted: {predicted:.2f}"
                )
        else:
            print("❌ Failed to fetch SKU accuracy:", r.text)


    def past_accuracy_store(token):
        url = f"{BASE_URL}/forecast/accuracy/store"
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(url, headers=headers)
        if r.ok:
            data = r.json()
            print("\n📊 Store Forecast Accuracy:")
            for row in data:
                store_id = row.get('store_id') or "Unknown"
                week_start = row.get('week_start') or "Unknown"
                bias = row.get('bias')
                wmape = row.get('wmape')
                mae = row.get('mae')
                actuals = row.get('actuals')
                predicted = row.get('predicted')

                print(
                    f"🏬 Store: {store_id} | "
                    f"📅 Week Start: {week_start} | "
                    f"🎯 Bias: {bias:.2f}% | "
                    f"📉 WMAPE: {wmape:.2f}% | "
                    f"📏 MAE: {mae:.2f} | "
                    f"🟢 Actuals: {actuals:.2f} | "
                    f"🔵 Predicted: {predicted:.2f}"
                )
        else:
            print("❌ Failed to fetch Store accuracy:", r.text)

    
    def view_weekly_forecast(token):
        hdr = {"Authorization": f"Bearer {token}"}

        # Fetch available stores
        r = requests.get(f"{BASE_URL}/stores", headers=hdr, timeout=20)
        stores = r.json().get("stores", []) if r.ok else []
        print("\n🏬 Available Stores:")
        if stores:
            for s in stores:
                print(f"  - {s['store_id']} ({s['name']} - {s['city']})")
        else:
            print("  🙅 No stores found.")

        # Fetch available SKUs
        r = requests.get(f"{BASE_URL}/skus", headers=hdr, timeout=20)
        skus_list = r.json().get("skus", []) if r.ok else []
        print("\n📦 Available SKUs:")
        if skus_list:
            for s in skus_list:
                print(f"  - {s}")
        else:
            print("  🙅 No SKUs found.")

        # Ask user for filters
        print("\n🔎 Forecast Filters")
        store_ids_in = input("Enter store id(s) (comma-separated, leave blank for all): ").strip()
        skus_in = input("Enter SKUs (comma-separated, leave blank for all): ").strip()

        # ✅ Only allow future weeks override
        future_weeks_in = input("Enter number of future weeks (leave blank for user default): ").strip()

        try:
            store_ids = [s.strip() for s in store_ids_in.split(",") if s.strip()] if store_ids_in else None
            skus = [s.strip() for s in skus_in.split(",") if s.strip()] if skus_in else None
            future_weeks = int(future_weeks_in) if future_weeks_in else None  # None => backend uses lookahead_days
        except ValueError:
            print("🚫 Invalid input. Please enter numeric value for future weeks.")
            return

        payload = {
            "store_ids": store_ids,
            "skus": skus
        }
        if future_weeks is not None:
            payload["future_weeks"] = future_weeks  # ✅ send only if user explicitly provided

        # Call backend
        r = requests.post(f"{BASE_URL}/forecast/weekly", json=payload, headers=hdr, timeout=20)
        if not r.ok:
            print("❌ Failed to fetch weekly forecast:", r.text)
            return

        data = r.json().get("forecasts", [])
        if not data:
            print("🙅 No forecast data available for given filters.")
            return

        print("\n📊 Weekly Forecast Results:")
        for row in data:
            actual_value = row.get("weekly_actual")
            forecast_value = row.get("weekly_forecast", 0)

            if actual_value is not None:
                print(
                    f"🏬 Store: {row['store_code']} | 📦 SKU: {row['sku']} | "
                    f"📅 Week Start: {row['week_start']} | "
                    f"📊 Actual: {actual_value:.2f} units | 🔮 Forecast: {forecast_value:.2f} units"
                )
            else:
                print(
                    f"🏬 Store: {row['store_code']} | 📦 SKU: {row['sku']} | "
                    f"📅 Week Start: {row['week_start']} | "
                    f"🔮 Forecast: {forecast_value:.2f} units | 📊 Actual: N/A"
                )



    def forecast_logs():
        url = f"{BASE_URL}/forecast/logs"
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(url, headers=headers)
        print(r.json())


    def overall_forecast_accuracy(token):
        url = f"{BASE_URL}/forecast/accuracy/overall"
        headers = {"Authorization": f"Bearer {token}"}

        weeks_input = input("Enter number of past weeks [leave blank for default lookahead]: ").strip()
        params = {}
        if weeks_input.isdigit() and int(weeks_input) > 0:
            params["weeks"] = int(weeks_input)

        r = requests.get(url, headers=headers, params=params)

        if not r.ok:
            print("❌ Failed to fetch overall accuracy:", r.text)
            return []

        data = r.json()
        rows = data.get("results", []) if isinstance(data, dict) else data

        print("\n📊 Overall Forecast Accuracy (Week-wise):")
        if not rows:
            print("🙅 No data available.")
            return []

        for row in rows:
            print(
                f"📅 Week: {row['week_start']} | "
                f"🟢 Actuals: {row['actuals']:.2f} | "
                f"🔵 Forecast: {row['forecast']:.2f} | "
                f"🎯 Bias: {row['bias']:.2f}% | "
                f"📉 WMAPE: {row['wmape']:.2f}% | "
                f"📏 MAE: {row['mae']:.2f}"
            )

        return rows

    def drilldown_forecast_accuracy(token):
        url = f"{BASE_URL}/forecast/accuracy/detail"
        headers = {"Authorization": f"Bearer {token}"}

        # Step 1: Fetch week-level accuracy first
        r = requests.get(url, headers=headers, params={"granularity": "week"})
        if not r.ok:
            print("❌ Failed to fetch forecast accuracy:", r.text)
            return

        data = r.json()
        rows = data.get("results", []) if isinstance(data, dict) else data
        if not rows:
            print("🙅 No data found.")
            return

        print("\n📊 Overall Forecast Accuracy (Week-wise):")
        for row in rows:
            print(
                f"📅 Week: {row['week_start']} | "
                f"🟢 Actuals: {row['actuals']:.2f} | "
                f"🔵 Forecast: {row['predicted']:.2f} | "
                f"🎯 Bias: {row['bias']:.2f}% | "
                f"📉 WMAPE: {row['wmape']:.2f}% | "
                f"📏 MAE: {row['mae']:.2f}"
            )

        # Step 2: Ask user to pick week(s) (multi-select)
        print("\n📅 Available Weeks:")
        for idx, row in enumerate(rows, start=1):
            print(f"  {idx}. {row['week_start']}")
        week_choice = input(f"Select week(s) (comma-separated 1-{len(rows)}, leave blank for all): ").strip()

        if week_choice:
            week_indices = [int(x) for x in week_choice.split(",") if x.strip().isdigit()]
            selected_weeks = [rows[i - 1]["week_start"] for i in week_indices if 1 <= i <= len(rows)]
        else:
            selected_weeks = [r["week_start"] for r in rows]  # All by default

        # Step 3: Get available stores (multi-select)
        r = requests.get(f"{BASE_URL}/stores", headers=headers, timeout=20)
        stores = r.json().get("stores", []) if r.ok else []
        print("\n🏬 Available Stores:")
        if stores:
            for s in stores:
                print(f"  - {s['store_id']} ({s['name']} - {s['city']})")
        else:
            print("  🙅 No stores found.")

        store_choice = input("Enter store_id(s) [comma-separated, leave blank for all]: ").strip()
        selected_stores = [x.strip() for x in store_choice.split(",") if x.strip()] if store_choice else []

        # Step 4: Get available SKUs (multi-select)
        r = requests.get(f"{BASE_URL}/skus", headers=headers, timeout=20)
        skus_list = r.json().get("skus", []) if r.ok else []
        print("\n📦 Available SKUs:")
        if skus_list:
            for s in skus_list:
                print(f"  - {s}")
        else:
            print("  🙅 No SKUs found.")

        sku_choice = input("Enter SKU(s) [comma-separated, leave blank for all]: ").strip()
        selected_skus = [x.strip() for x in sku_choice.split(",") if x.strip()] if sku_choice else []

        # Step 5: Fetch day-level accuracy
        params = {
            "weeks": ",".join(selected_weeks),
            "granularity": "day"
        }
        if selected_stores:
            params["store"] = ",".join(selected_stores)
        if selected_skus:
            params["sku"] = ",".join(selected_skus)

        r = requests.get(url, headers=headers, params=params)
        if not r.ok:
            print("❌ Failed to fetch day-level accuracy:", r.text)
            return

        data = r.json()
        rows = data.get("results", []) if isinstance(data, dict) else data
        if not rows:
            print("🙅 No day-level data found for selection.")
            return

        print(f"\n📊 Day-Level Accuracy for Week(s): {', '.join(selected_weeks)}")
        for row in rows:
            key = row.get("date") or row.get("week_start")
            print(
                f"📅 {key} | "
                f"🟢 Actuals: {row['actuals']:.2f} | "
                f"🔵 Forecast: {row['predicted']:.2f} | "
                f"🎯 Bias: {row['bias']:.2f}% | "
                f"📉 WMAPE: {row['wmape']:.2f}% | "
                f"📏 MAE: {row['mae']:.2f}"
            )


    options = {
        "1": ("Set Forecast Schedule", set_forecast_schedule),
        "2": ("View Forecast Schedule", view_forecast_schedule),
        "3": ("Update Forecast Horizon (N weeks)", update_forecast_horizon),
        "4": ("Run Forecast Manually", run_forecast),
        "5": ("Store-Level Forecast (Next N Weeks)", store_level_forecast),
        "6": ("SKU-Level Forecast (Next N Weeks)", sku_level_forecast),
        "7": ("Past Accuracy - Store", lambda: past_accuracy_store(token)),
        "8": ("Past Accuracy - SKU", lambda: past_accuracy_sku(token)),
        "9": ("Chart Data with Trendline", chart_data),
        "10": ("View Weekly Forecast", lambda: view_weekly_forecast(token)),
        "11": ("Forecast Run Logs", forecast_logs),
        "12": ("Overall Forecast Accuracy", lambda: overall_forecast_accuracy(token)),
        "13": ("Drilldown Forecast Accuracy (Week/SKU/Store)", lambda: drilldown_forecast_accuracy(token)),
        
        "0": ("Exit Forecast Menu", None)
    }

    while True:
        print("\n📊 Forecast Module Menu")
        for key, (desc, _) in options.items():
            print(f"{key}. {desc}")

        choice = input("Select an option: ").strip()
        if choice == "0":
            break
        elif choice in options:
            options[choice][1]()
        else:
            print("❌ Invalid choice. Try again.")


def rebalancer(token):
    """
    Client function to trigger inventory rebalancing, fetching all required
    data in a single API call.
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    # helper function to convert the data to a CSV string
    def convert_to_csv_client(data):
        if not data:
            return ""
        
        output = StringIO()
        
        fieldnames = [
            "Source",
            "Destination",
            "SKU",
            "Units",
            "Source Inventory",
            "Destination Inventory",
            "Source DOS",
            "Destination DOS",
            "Arrival Date"
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        rows = []
        for row in data:
            rows.append({
                "Source": row["src"],
                "Destination": row["dst"],
                "SKU": row["sku"],
                "Units": row["units"],
                "Source Inventory": row["src_current_inventory"],
                "Destination Inventory": row["dst_current_inventory"],
                "Source DOS": row["src_days_of_supply"],
                "Destination DOS": row["dst_days_of_supply"],
                "Arrival Date": row["arrival_date"]
            })
        writer.writerows(rows)
        return output.getvalue()


    print("📦 Inventory Rebalancing Client\n")

    try:
        ddos_days = int(input("Enter Desired Days of Supply (DDOS): ").strip())
    except ValueError:
        print("❌ Invalid input. Please enter a number.")
        return

    payload = {"ddos_days": ddos_days}

    try:
        # Make a single, efficient API call to get both detailed and summary data
        print("⏳ Calculating rebalancing recommendations...")
        url = f"{BASE_URL}/api/rebalance"
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()

        data = resp.json()
        allocations = data.get("allocations", [])
        summary_data = data.get("summary", [])

        if not allocations:
            print("\n✅ No transfers required. Inventory is already balanced.")
            return

    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        # Exit gracefully if the initial request fails
        return

    # Now, present the menu using the data you already have
    while True:
        print("\n--- Options ---")
        print("1. View Detailed SKU-level Transfers")
        print("2. View Transfer Summary by Route")
        print("3. Download Results as CSV")
        print("4. Exit")
        
        choice = input("Enter your choice (1-4): ").strip()

        if choice == '1':
            print("\n📊 Recommended Transfers (Detailed):\n")
            table = [
                [i + 1, a["src"], a["dst"], a["sku"], a["units"], a["src_days_of_supply"], a["dst_days_of_supply"], a["src_current_inventory"], a["dst_current_inventory"], a["arrival_date"]]
                for i, a in enumerate(allocations)
            ]
            headers_ = ["#", "Source", "Destination", "SKU", "Units", "Src DOS", "Dst DOS", "Src Inv", "Dst Inv", "Arrival Date"]
            print(tabulate(table, headers=headers_, tablefmt="fancy_grid"))

        elif choice == '2':
            print("\n📊 Transfer Summary by Route:\n")
            summary_table = [
                [i + 1, s["src"], s["dest"], s["distinct_skus"], s["total_units"], s["src_days_of_supply"], s["dst_days_of_supply"], s["arrival_date"]]
                for i, s in enumerate(summary_data)
            ]
            summary_headers = ["#", "Source", "Destination", "Distinct SKUs", "Total Units", "Src DOS", "Dst DOS", "Arrival Date"]
            print(tabulate(summary_table, headers=summary_headers, tablefmt="fancy_grid"))

        elif choice == '3':
            csv_data = convert_to_csv_client(allocations)
            filename = f"rebalancing_recommendations_{date.today().strftime('%Y-%m-%d')}.csv"
            
            with open(filename, "w", newline="") as f:
                f.write(csv_data)
            
            print(f"✅ Successfully downloaded recommendations to '{filename}'.")

        elif choice == '4':
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please enter a number from 1 to 4.")

def inventory_levels_filter(token):
    """
    Interactive inventory levels filter using existing API endpoints
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    def get_inventory_levels_api(level_filter=None, store_ids=None):
        """Fetch inventory levels via API"""
        url = f"{BASE_URL}/store_inventory_summary"  # You'll need to create this endpoint
        params = {}
        
        if level_filter:
            params['level_category'] = level_filter
        if store_ids:
            params['store_ids'] = ','.join(map(str, store_ids))
            
        try:
            response = requests.get(url, headers=headers, params=params, timeout=20)
            if response.ok:
                return response.json().get('data', [])
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return []
    
    def display_results(data, title):
        print(f"\n📊 {title}")
        print("-" * len(title))
        
        if not data:
            print("❌ No data found for the selected criteria.")
            return
        
        for row in data:
            print(f"🏬 Store: {row.get('store_name', 'N/A')} (ID: {row.get('store_id', 'N/A')})")
            print(f"   📍 Location: {row.get('store_location', 'N/A')}")
            print(f"   📦 Current: {row.get('current_inventory', 0)} / {row.get('max_capacity', 0)} units")
            print(f"   📊 Level: {row.get('inventory_percentage', 0):.1f}% ({row.get('level_category', 'N/A')})")
            print(f"   🎯 Target: {row.get('target_level', 0)} | Safety: {row.get('safety_stock', 0)}")
            print(f"   ⚡ Status: {row.get('operational_status', 'N/A')}")
            print(f"   🕒 Updated: {row.get('last_updated', 'N/A')}")
            print()
        
        print(f"📈 Total Records: {len(data)}")
    
    # Main menu loop
    while True:
        print("\n" + "="*50)
        print("📊 INVENTORY LEVELS FILTER")
        print("="*50)
        print("1. 🔴 Low Inventory Stores (< 20%)")
        print("2. 🟡 Medium Inventory Stores (20% - 80%)")
        print("3. 🟢 High Inventory Stores (> 80%)")
        print("4. 📈 All Stores")
        print("5. 🔍 Custom Store Filter")
        print("6. 📊 Summary Statistics")
        print("7. ❌ Back to Main Menu")
        print("="*50)
        
        choice = input("Enter your choice (1-7): ").strip()
        
        if choice == "1":
            data = get_inventory_levels_api(level_filter='Low')
            display_results(data, "LOW INVENTORY STORES (< 20%)")
            
        elif choice == "2":
            data = get_inventory_levels_api(level_filter='Medium')
            display_results(data, "MEDIUM INVENTORY STORES (20% - 80%)")
            
        elif choice == "3":
            data = get_inventory_levels_api(level_filter='High')
            display_results(data, "HIGH INVENTORY STORES (> 80%)")
            
        elif choice == "4":
            data = get_inventory_levels_api()
            display_results(data, "ALL STORES")
            
        elif choice == "5":
            print("\n🔍 Custom Store Filter")
            try:
                store_ids_input = input("Enter store IDs (comma-separated, e.g., 167,168,169): ")
                store_ids = [int(x.strip()) for x in store_ids_input.split(',') if x.strip()]
                
                level_input = input("Enter level filter (Low/Medium/High or press Enter for all): ").strip()
                level_filter = level_input if level_input in ['Low', 'Medium', 'High'] else None
                
                data = get_inventory_levels_api(level_filter=level_filter, store_ids=store_ids)
                display_results(data, "CUSTOM FILTER RESULTS")
                
            except ValueError:
                print("❌ Invalid store IDs format. Please enter numbers separated by commas.")
        
        elif choice == "6":
            # Use existing API or create a summary endpoint
            url = f"{BASE_URL}/store_inventory_summary/stats"
            try:
                response = requests.get(url, headers=headers, timeout=20)
                if response.ok:
                    stats = response.json().get('data', [])
                    print("\n📊 INVENTORY LEVEL SUMMARY")
                    for row in stats:
                        print(f"{row['level_category']:>6}: {row['store_count']} stores "
                              f"(avg: {row['avg_percentage']}%, "
                              f"range: {row['min_percentage']}%-{row['max_percentage']}%)")
                else:
                    print(f"❌ Failed to fetch summary: {response.text}")
            except Exception as e:
                print(f"❌ Error getting summary: {e}")
        
        elif choice == "7":
            break
        else:
            print("❌ Invalid choice. Please enter 1-7.")
        
        input("\nPress Enter to continue...")


def weeks_of_supply_menu(token):
    """Handle weeks of supply analysis menu"""
    while True:
        print("\n==== 📊 Weeks of Supply Analysis ====")
        print("1. View Store Summary")
        print("2. Recalculate Categories with Custom Thresholds")
        print("3. Refresh Weeks of Supply Data")
        print("4. Back to Main Menu")
        
        choice = input("\nEnter your choice: ").strip()
        
        if choice == "1":
            view_weeks_of_supply_by_store(token)
        elif choice == "2":
            recalculate_categories_with_thresholds(token)
        elif choice == "3":
            refresh_weeks_of_supply(token)
        elif choice == "4":
            break
        else:
            print("❌ Invalid choice.")


def recalculate_categories_with_thresholds(token):
    """Recalculate categories based on custom week thresholds"""
    print("\n🔧 Configure Category Thresholds")
    print("="*60)
    print("Current default thresholds:")
    print("  🔴 Critical: < 2 weeks")
    print("  🟠 Low: 2-4 weeks")
    print("  🟢 Adequate: 4-8 weeks")
    print("  🔵 High: >= 8 weeks")
    print("="*60)
    
    try:
        # Get custom thresholds from user
        print("\nEnter new thresholds (press Enter to use defaults):")
        
        critical_input = input("Critical threshold (default: 2 weeks): ").strip()
        critical_threshold = float(critical_input) if critical_input else 2
        
        low_input = input("Low threshold (default: 4 weeks): ").strip()
        low_threshold = float(low_input) if low_input else 4
        
        adequate_input = input("Adequate threshold (default: 8 weeks): ").strip()
        adequate_threshold = float(adequate_input) if adequate_input else 8
        
        # Validate thresholds
        if critical_threshold <= 0 or low_threshold <= 0 or adequate_threshold <= 0:
            print("❌ All thresholds must be positive numbers.")
            return
        
        if not (critical_threshold < low_threshold < adequate_threshold):
            print("❌ Thresholds must be in ascending order: critical < low < adequate")
            return
        
        # Confirm with user
        print(f"\n📋 New threshold configuration:")
        print(f"  🔴 Critical: < {critical_threshold} weeks")
        print(f"  🟠 Low: {critical_threshold} - {low_threshold} weeks")
        print(f"  🟢 Adequate: {low_threshold} - {adequate_threshold} weeks")
        print(f"  🔵 High: >= {adequate_threshold} weeks")
        
        confirm = input("\nProceed with recalculation? (y/n): ").strip().lower()
        
        if confirm != 'y':
            print("⚠️  Operation cancelled.")
            return
        
        print("\n🔄 Recalculating categories...")
        
        # Send POST request with thresholds
        resp = requests.post(
            f"{BASE_URL}/weeks-of-supply/recalculate-categories",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "critical_threshold": critical_threshold,
                "low_threshold": low_threshold,
                "adequate_threshold": adequate_threshold
            }
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"\n✅ Success! Categories recalculated for {data.get('rows_affected', 0)} records.")
            print("\n📊 Applied thresholds:")
            thresholds = data.get('thresholds', {})
            print(f"  🔴 Critical: {thresholds.get('critical', 'N/A')}")
            print(f"  🟠 Low: {thresholds.get('low', 'N/A')}")
            print(f"  🟢 Adequate: {thresholds.get('adequate', 'N/A')}")
            print(f"  🔵 High: {thresholds.get('high', 'N/A')}")
        else:
            error_data = resp.json()
            print(f"❌ Error: {error_data.get('error', 'Unknown error')}")
    
    except ValueError:
        print("❌ Invalid input. Please enter valid numbers.")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    
    input("\nPress Enter to continue...")


def refresh_weeks_of_supply(token):
    """Manually refresh weeks of supply calculations"""
    print("\n🔄 Refreshing weeks of supply data...")
    
    try:
        resp = requests.post(
            f"{BASE_URL}/weeks-of-supply/refresh",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Success! {data.get('rows_affected', 0)} records updated.")
        else:
            print(f"❌ Error: {resp.json().get('error', 'Unknown error')}")
    
    except Exception as e:
        print(f"❌ Error refreshing data: {str(e)}")


def view_weeks_of_supply_by_store(token):
    """View weeks of supply analysis - store selection and SKU details"""
    
    # Step 1: Get store summary
    print("\n📦 Fetching store summary...")
    
    try:
        resp = requests.get(
            f"{BASE_URL}/weeks-of-supply/store-summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if resp.status_code != 200:
            print(f"❌ Error: {resp.json().get('error', 'Unknown error')}")
            return
        
        stores = resp.json().get('data', [])
        
        if not stores:
            print("\n⚠️  No data available. Please refresh weeks of supply data first (Option 3).")
            return
        
        # Display store list
        print("\n" + "="*80)
        print("📍 AVAILABLE STORES")
        print("="*80)
        print(f"{'#':<5} {'Store ID':<15} {'Total SKUs':<12} {'Critical':<10} {'Low':<10} {'Adequate':<10} {'High':<10}")
        print("-"*80)
        
        for idx, store in enumerate(stores, 1):
            print(f"{idx:<5} {store['store_id']:<15} {store['total_skus']:<12} "
                  f"{store['critical_count']:<10} {store['low_count']:<10} "
                  f"{store['adequate_count']:<10} {store['high_count']:<10}")
        
        print("="*80)
        
        # Step 2: Let user select a store
        store_choice = input("\nEnter store number to view SKU details (or 'q' to go back): ").strip()
        
        if store_choice.lower() == 'q':
            return
        
        try:
            store_idx = int(store_choice) - 1
            if store_idx < 0 or store_idx >= len(stores):
                print("❌ Invalid store number.")
                return
            
            selected_store = stores[store_idx]
            store_id = selected_store['store_id']
            
            # Step 3: Show store overview
            print(f"\n{'='*100}")
            print(f"📦 STORE ID: {store_id}")
            print(f"{'='*100}")
            print(f"📊 Total SKUs: {selected_store['total_skus']}")
            print(f"🔴 Critical: {selected_store['critical_count']}")
            print(f"🟠 Low: {selected_store['low_count']}")
            print(f"🟢 Adequate: {selected_store['adequate_count']}")
            print(f"🔵 High: {selected_store['high_count']}")
            print(f"📈 Avg Weeks of Supply: {float(selected_store.get('avg_weeks_of_supply', 0)):.2f}")
            print(f"{'='*100}\n")
            
            # Step 4: Filter options
            print("Filter by category (optional):")
            print("1. Critical only")
            print("2. Low only")
            print("3. Adequate only")
            print("4. High only")
            print("5. All categories")
            
            filter_choice = input("\nEnter filter choice (default: 5 - All): ").strip() or "5"
            
            category_map = {
                "1": "Critical",
                "2": "Low",
                "3": "Adequate",
                "4": "High",
                "5": None
            }
            
            category_filter = category_map.get(filter_choice)
            
            # Step 5: Fetch SKU details
            params = {}
            if category_filter:
                params['category'] = category_filter
            
            sku_resp = requests.get(
                f"{BASE_URL}/weeks-of-supply/sku-details/{store_id}",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
            
            if sku_resp.status_code != 200:
                print(f"❌ Error: {sku_resp.json().get('error', 'Unknown error')}")
                return
            
            skus = sku_resp.json().get('data', [])
            
            if not skus:
                print("\n⚠️  No SKUs found with the selected filter.")
                return
            
            # Step 6: Display SKU details
            print(f"\n{'='*100}")
            print(f"📦 SKU DETAILS - Store ID: {store_id} {f'(Filter: {category_filter})' if category_filter else '(All)'}")
            print(f"{'='*100}")
            print(f"{'SKU':<20} {'Current Inv':<15} {'Weekly Demand':<15} {'Weeks Left':<15} {'Category':<15}")
            print("-"*100)
            
            for sku in skus:
                # Color coding for terminal
                category = sku['category']
                if category == 'Critical':
                    category_display = f"🔴 {category}"
                elif category == 'Low':
                    category_display = f"🟠 {category}"
                elif category == 'Adequate':
                    category_display = f"🟢 {category}"
                else:
                    category_display = f"🔵 {category}"
                
                weeks_left = float(sku['weeks_of_supply'])
                weeks_display = f"{weeks_left:.1f}" if weeks_left < 999 else "999+"
                
                print(f"{sku['sku']:<20} "
                      f"{int(sku['current_inventory']):<15} "
                      f"{float(sku['avg_weekly_demand']):<15.2f} "
                      f"{weeks_display:<15} {category_display:<15}")
            
            print("="*100)
            print(f"\n📊 Showing {len(skus)} SKU(s)")
            
            # Option to export or view more details
            input("\nPress Enter to continue...")
            
        except ValueError:
            print("❌ Invalid input. Please enter a number.")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    except Exception as e:
        print(f"❌ Error fetching store summary: {str(e)}")


def view_demand_trend_by_store(token):
    """View demand trend analysis - store selection and SKU details"""
    
    # Step 1: Get store summary
    print("\n📈 Fetching demand trend store summary...")
    
    try:
        resp = requests.get(
            f"{BASE_URL}/api/demand-trend/store-summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Debug information
        print(f"\n🔍 DEBUG INFO:")
        print(f"   Status Code: {resp.status_code}")
        print(f"   Content-Type: {resp.headers.get('Content-Type', 'N/A')}")
        print(f"   Response Length: {len(resp.text)} chars")
        print(f"   First 200 chars: {resp.text[:200]}")
        
        if resp.status_code != 200:
            try:
                error_data = resp.json()
                print(f"\n❌ Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"\n❌ HTTP {resp.status_code} Error")
                print(f"   Response: {resp.text[:500]}")
            return
        
        try:
            result = resp.json()
        except Exception as json_err:
            print(f"\n❌ Failed to parse JSON response")
            print(f"   Error: {str(json_err)}")
            print(f"   Response text: {resp.text[:500]}")
            return
        
        if not result.get('success'):
            print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
            return
        
        stores = result.get('data', [])
        
        if not stores:
            print("\n⚠️  No data available. Please refresh demand trend data first (Option 2).")
            print("   This will calculate demand trends based on your sales and forecast data.")
            return
        
        # Display store list
        print("\n" + "="*100)
        print("📍 DEMAND TREND - STORE SUMMARY")
        print("="*100)
        print(f"{'#':<5} {'Store ID':<15} {'Total SKUs':<12} {'Accelerating':<15} {'Stable':<15} {'Decelerating':<15}")
        print("-"*100)
        
        for idx, store in enumerate(stores, 1):
            print(f"{idx:<5} {store['store_id']:<15} {store['total_skus']:<12} "
                  f"🟢 {store.get('accelerating_count', 0):<13} "
                  f"🔵 {store.get('stable_count', 0):<13} "
                  f"🟠 {store.get('decelerating_count', 0):<13}")
        
        print("="*100)
        
        # Step 2: Let user select a store
        store_choice = input("\nEnter store number to view SKU details (or 'q' to go back): ").strip()
        
        if store_choice.lower() == 'q':
            return
        
        try:
            store_idx = int(store_choice) - 1
            if store_idx < 0 or store_idx >= len(stores):
                print("❌ Invalid store number.")
                return
            
            selected_store = stores[store_idx]
            store_id = selected_store['store_id']
            
            # Step 3: Show store overview
            print(f"\n{'='*100}")
            print(f"📈 DEMAND TREND - STORE ID: {store_id}")
            print(f"{'='*100}")
            print(f"📊 Total SKUs: {selected_store['total_skus']}")
            print(f"🟢 Accelerating (Stock Up): {selected_store.get('accelerating_count', 0)}")
            print(f"🔵 Stable (Normal): {selected_store.get('stable_count', 0)}")
            print(f"🟠 Decelerating (Slow Down): {selected_store.get('decelerating_count', 0)}")
            print(f"{'='*100}\n")
            
            # Step 4: Filter options
            print("Filter by trend category (optional):")
            print("1. Accelerating only (Stock Up)")
            print("2. Stable only (Normal)")
            print("3. Decelerating only (Slow Down)")
            print("4. All categories")
            
            filter_choice = input("\nEnter filter choice (default: 4 - All): ").strip() or "4"
            
            category_map = {
                "1": "Accelerating",
                "2": "Stable",
                "3": "Decelerating",
                "4": None
            }
            
            category_filter = category_map.get(filter_choice)
            
            # Step 5: Fetch SKU details
            params = {}
            if category_filter:
                params['trend_category'] = category_filter
            
            sku_resp = requests.get(
                f"{BASE_URL}/api/demand-trend/sku-details/{store_id}",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
            
            if sku_resp.status_code != 200:
                try:
                    print(f"❌ Error: {sku_resp.json().get('error', 'Unknown error')}")
                except:
                    print(f"❌ HTTP {sku_resp.status_code} Error: {sku_resp.text[:200]}")
                return
            
            try:
                sku_result = sku_resp.json()
            except:
                print(f"❌ Failed to parse SKU details response")
                print(f"   Response: {sku_resp.text[:500]}")
                return
            
            if not sku_result.get('success'):
                print(f"❌ Error: {sku_result.get('error', 'Unknown error')}")
                return
            
            skus = sku_result.get('data', [])
            
            if not skus:
                print("\n⚠️  No SKUs found with the selected filter.")
                return
            
            # Step 6: Display SKU details
            print(f"\n{'='*120}")
            print(f"📈 DEMAND TREND - SKU DETAILS - Store ID: {store_id} {f'(Filter: {category_filter})' if category_filter else '(All)'}")
            print(f"{'='*120}")
            print(f"{'SKU':<20} {'Recent Sales':<15} {'Forecast':<15} {'Trend %':<15} {'Category':<20}")
            print("-"*120)
            
            for sku in skus:
                # Color coding for terminal
                category = sku['trend_category']
                if category == 'Accelerating':
                    category_display = f"🟢 {category}"
                elif category == 'Stable':
                    category_display = f"🔵 {category}"
                else:
                    category_display = f"🟠 {category}"
                
                recent_sales = float(sku.get('recent_avg_sales', 0))
                forecast = float(sku.get('forecast_demand', 0))
                trend_pct = float(sku.get('trend_percentage', 0))
                
                trend_display = f"{trend_pct:+.1f}%" if trend_pct != 0 else "0.0%"
                
                print(f"{sku['sku']:<20} "
                      f"{recent_sales:<15.2f} "
                      f"{forecast:<15.2f} "
                      f"{trend_display:<15} "
                      f"{category_display:<20}")
            
            print("="*120)
            print(f"\n📊 Showing {len(skus)} SKU(s)")
            
            # Summary statistics
            if skus:
                total_accelerating = sum(1 for s in skus if s['trend_category'] == 'Accelerating')
                total_stable = sum(1 for s in skus if s['trend_category'] == 'Stable')
                total_decelerating = sum(1 for s in skus if s['trend_category'] == 'Decelerating')
                
                print(f"\n📈 Summary:")
                print(f"   🟢 Accelerating: {total_accelerating} SKUs")
                print(f"   🔵 Stable: {total_stable} SKUs")
                print(f"   🟠 Decelerating: {total_decelerating} SKUs")
            
            input("\nPress Enter to continue...")
            
        except ValueError:
            print("❌ Invalid input. Please enter a number.")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        print(f"   Make sure your Flask server is running at {BASE_URL}")
    except Exception as e:
        print(f"❌ Error fetching store summary: {str(e)}")
        import traceback
        traceback.print_exc()


def refresh_demand_trend(token):
    """Manually refresh demand trend calculations"""
    print("\n" + "="*60)
    print("🔄 REFRESH DEMAND TREND DATA")
    print("="*60)
    print("\nThis will update the last_updated timestamp for all records.")
    print("="*60)
    
    lookback = input("\nLookback days (default 30): ").strip() or "30"
    horizon = input("Forecast horizon days (default 14): ").strip() or "14"
    
    try:
        lookback_int = int(lookback)
        horizon_int = int(horizon)
        
        print("\n🔄 Processing...")
        
        resp = requests.post(
            f"{BASE_URL}/api/demand-trend/refresh",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "lookback_days": lookback_int,
                "forecast_horizon_days": horizon_int
            }
        )
        
        print(f"\n🔍 DEBUG: Status Code: {resp.status_code}")
        print(f"🔍 DEBUG: Response: {resp.text[:500]}")
        
        if resp.status_code == 200:
            try:
                result = resp.json()
                if result.get('success'):
                    rows_affected = result.get('rows_affected', 0)
                    print(f"\n✅ Success! Demand trend data refreshed.")
                    print(f"📊 {rows_affected} records updated.")
                    print(f"\nYou can now view demand trends by store (Option 1).")
                else:
                    print(f"\n❌ Error: {result.get('error', 'Unknown error')}")
            except:
                print(f"\n❌ Failed to parse response JSON")
                print(f"   Response: {resp.text[:500]}")
        else:
            try:
                error_msg = resp.json().get('error', 'Unknown error')
                print(f"\n❌ Error: {error_msg}")
            except:
                print(f"\n❌ HTTP {resp.status_code} Error")
                print(f"   Response: {resp.text[:500]}")
    
    except ValueError:
        print("❌ Invalid input. Please enter numeric values.")
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {str(e)}")
        print(f"   Make sure your Flask server is running at {BASE_URL}")
    except Exception as e:
        print(f"❌ Error refreshing data: {str(e)}")
        import traceback
        traceback.print_exc()


def demand_trend_menu(token):
    """Handle demand trend analysis menu"""
    while True:
        print("\n" + "="*60)
        print("📈 DEMAND TREND ANALYSIS")
        print("="*60)
        print("1. View Store Summary & SKU Details")
        print("2. Refresh Demand Trend Data")
        print("3. View Available Categories")
        print("4. Back to Main Menu")
        print("="*60)
        
        choice = input("\nEnter your choice: ").strip()
        
        if choice == "1":
            view_demand_trend_by_store(token)
        elif choice == "2":
            refresh_demand_trend(token)
        elif choice == "3":
            view_trend_categories(token)
        elif choice == "4":
            break
        else:
            print("❌ Invalid choice. Please enter 1-4.")


def view_trend_categories(token):
    """View available trend categories and their descriptions"""
    try:
        resp = requests.get(
            f"{BASE_URL}/api/demand-trend/categories",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        print(f"\n🔍 DEBUG: Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            try:
                result = resp.json()
                if result.get('success'):
                    categories = result.get('data', [])
                    
                    print("\n" + "="*80)
                    print("📊 DEMAND TREND CATEGORIES")
                    print("="*80)
                    
                    for cat in categories:
                        icon = "🟢" if cat['value'] == "Accelerating" else "🔵" if cat['value'] == "Stable" else "🟠"
                        print(f"\n{icon} {cat['label']}")
                        print(f"   Description: {cat['description']}")
                    
                    print("\n" + "="*80)
                    print("\n💡 Use these categories to filter SKUs when viewing store details.")
                else:
                    print(f"❌ Error: {result.get('error', 'Unknown error')}")
            except:
                print(f"❌ Failed to parse JSON")
                print(f"   Response: {resp.text[:500]}")
        else:
            try:
                print(f"❌ Error: {resp.json().get('error', 'Unknown error')}")
            except:
                print(f"❌ HTTP {resp.status_code} Error: {resp.text[:200]}")
        
        input("\nPress Enter to continue...")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

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

                    if action == "1":
                        upload_csv(token)
                    elif action == "2":
                        refresh_alerts(token)
                        view_alerts(token)
                    elif action == "3":
                        view_dashboard(token)
                    elif action == "4":
                        view_store_summary(token)
                    elif action == "5":
                        settings_menu(token)
                    elif action == "6":
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
                    elif action == "14":
                        display_availability_from_db(token)
                    elif action == "15":
                        forecast_menu(token)
                    elif action == "16":
                        rebalancer(token)
                    elif action == "17":  
                        inventory_levels_filter(token)
                    elif action == "18":  # NEW: Weeks of Supply
                        weeks_of_supply_menu(token)
                    elif action == "19":
                        demand_trend_menu(token)
                    else:
                        print("❌ Invalid choice.")

if __name__ == "__main__":
    main()