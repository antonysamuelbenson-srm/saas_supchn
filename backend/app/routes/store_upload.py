# from flask import Blueprint, request, jsonify
# from supabase import create_client, Client
# from app.utils.jwt_utils import decode_jwt
# import os
# from dotenv import load_dotenv

# load_dotenv()
# url: str = os.environ.get("SUPABASE_URL")
# key: str = os.environ.get("ANON_KEY")
# supabase: Client = create_client(url, key)


# bp = Blueprint("store_upload", __name__)

# @bp.route('/store_upload', methods=['POST'])
# def store_upload():
#     data = request.json()
#     store_name = data.get("store-name")
#     store_location = data.get("store-location")

#     response = (
#         supabase.table("stores")
#         .insert({"store_name" : store_name, "location" : store_location})
#         .execute()
#     )

# @bp.route('/store/summary', methods=['GET'])
# def store_summary():
#     token = request.headers.get("Authorization", "").replace("Bearer ", "")
#     payload = decode_jwt(token)
#     role_user_id = payload.get("role_user_id")

#     if not role_user_id:
#         return jsonify({"error": "Unauthorized"}), 401

#     # ✅ Fetch inventory data
#     inventory_resp = supabase.table("inventory_snapshot").select("*").eq("role_user_id", role_user_id).execute()
#     inventory_data = inventory_resp.data

#     # ✅ Fetch reorder configs
#     reorder_resp = supabase.table("reorder_config").select("*").eq("role_user_id", role_user_id).execute()
#     reorder_configs = {r["sku"]: r for r in reorder_resp.data}

#     # ✅ Group by store
#     summary = {}

#     for item in inventory_data:
#         store_key = f"{item['store_name']} | {item['store_location']}"
#         sku = item["sku"]
#         reorder = reorder_configs.get(sku, {})

#         if store_key not in summary:
#             summary[store_key] = []

#         summary[store_key].append({
#             "sku": sku,
#             "product_name": item.get("product_name"),
#             "quantity": item.get("quantity"),
#             "avg_daily_usage": reorder.get("avg_daily_usage"),
#             "lead_time_days": reorder.get("lead_time_days"),
#             "safety_stock": reorder.get("safety_stock"),
#             "reorder_point": reorder.get("reorder_point"),
#         })

#     return jsonify(summary)
from geopy.geocoders import Nominatim
import time

from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from app.utils.jwt_utils import decode_jwt
import os
from dotenv import load_dotenv

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("ANON_KEY")
supabase: Client = create_client(url, key)

bp = Blueprint("store_upload", __name__)

# @bp.route('/store_upload', methods=['POST'])
# def store_upload():
#     token = request.headers.get("Authorization", "").replace("Bearer ", "")
#     payload = decode_jwt(token)
#     role_user_id = payload.get("role_user_id")

#     if not role_user_id:
#         return jsonify({"error": "Unauthorized"}), 401

#     data = request.get_json()
#     store_name = data.get("store-name")
#     store_location = data.get("store-location")

#     if not store_name or not store_location:
#         return jsonify({"error": "Missing store name or location"}), 400

#     response = (
#         supabase.table("stores")
#         .insert({
#             "store_name": store_name,
#             "location": store_location,
#             "role_user_id": role_user_id
#         })
#         .execute()
#     )

#     if response.error:
#         return jsonify({"error": response.error.message}), 500

#     return jsonify({"message": "✅ Store added", "store": response.data}), 201

@bp.route('/store_upload', methods=['POST'])
def store_upload():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    store_name = data.get("store-name")
    store_location = data.get("store-location")

    if not store_name or not store_location:
        return jsonify({"error": "Missing store name or location"}), 400

    response = (
        supabase.table("stores")
        .insert({
            "store_name": store_name,
            "location": store_location,
            "role_user_id": role_user_id
        })
        .execute()
    )

    # ✅ Replace `.error` with a safe check:
    if not response.data:
        return jsonify({"error": "Failed to insert store."}), 500

    return jsonify({"message": "✅ Store added", "store": response.data}), 201



# Assuming you have a function to decode JWT:
# Example:
# def decode_jwt(token): -> returns dict with claims
# Implement it according to your JWT setup (PyJWT etc.)

geolocator = Nominatim(user_agent="inventory_app")
geocode_cache = {}

def get_coordinates(location_name):
    if location_name in geocode_cache:
        return geocode_cache[location_name]

    try:
        loc = geolocator.geocode(location_name)
        time.sleep(1)  # respect rate limits
        if loc:
            lat_lng = (loc.latitude, loc.longitude)
        else:
            lat_lng = (None, None)
    except Exception as e:
        print(f"Geocoding error for '{location_name}':", e)
        lat_lng = (None, None)

    geocode_cache[location_name] = lat_lng
    return lat_lng


@bp.route('/store/summary', methods=['GET'])
def store_summary():
    # 🔷 Extract and validate JWT
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)

    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # 🔷 Fetch stores
    stores_resp = supabase.table("stores").select("*").eq("role_user_id", role_user_id).execute()
    stores = stores_resp.data

    stores_data = {}
    for s in stores:
        store_id = s["store_id"]
        location_name = s["location"].strip()

        lat, lng = get_coordinates(location_name)

        stores_data[store_id] = {
            "store_name": s["store_name"].strip(),
            "location": location_name,
            "lat": lat,
            "lng": lng,
            "summary": []
        }

    # 🔷 Fetch inventory_snapshot
    inventory_resp = supabase.table("inventory_snapshot").select("*").eq("role_user_id", role_user_id).execute()
    inventory_data = inventory_resp.data

    # 🔷 Fetch reorder_config
    reorder_resp = supabase.table("reorder_config").select("*").eq("role_user_id", role_user_id).execute()
    reorder_configs = { r["sku"]: r for r in reorder_resp.data }

    for item in inventory_data:
        store_id = item["store_id"]
        store = stores_data.get(store_id)

        if not store:
            continue

        sku = item["sku"]
        reorder = reorder_configs.get(sku, {})

        store["summary"].append({
            "sku": sku,
            "product_name": item.get("product_name"),
            "quantity": item.get("quantity"),
            "avg_daily_usage": reorder.get("avg_daily_usage"),
            "lead_time_days": reorder.get("lead_time_days"),
            "safety_stock": reorder.get("safety_stock"),
            "reorder_point": reorder.get("reorder_point"),
        })

    result = list(stores_data.values())
    return jsonify(result)
