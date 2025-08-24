# from flask import Blueprint, request, jsonify, g
# from supabase import create_client, Client
# from datetime import datetime, timezone
# from collections import defaultdict
# import os
# from dotenv import load_dotenv
# from app.utils.jwt_utils import decode_jwt
# from app.utils.decorators import role_required

# # Load environment variables from .env
# load_dotenv()

# # Supabase initialization
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# ANON_KEY = os.getenv("ANON_KEY")
# supabase: Client = create_client(SUPABASE_URL, ANON_KEY)

# # Flask Blueprint
# bp = Blueprint("node_location_update", __name__)

# def fetch_allstores_data():
#     response = (
#         supabase.table("store_data")
#         .select("store_name")
#         .execute()
#     )
#     if response.status_code == 200:
#         return response.data
#     return []

# def user_choice(store_name, new_location):
#     response = (
#         supabase.table("store_data")
#         .update({"location": new_location})
#         .eq("name", store_name)
#         .execute()
#     )
#     if response.status_code == 200:
#         print("Node Location changed")
#         return True
#     else:
#         print("Failed to update location")
#         return False

# # Route to update location
# @bp.route("/update_store", methods=["POST"])
# @role_required
# def update_store():
#     user_id=g.user_id
#     data = request.get_json()
#     store_id = data.get("store_id")
#     if not store_id:
#         return jsonify({"error": "Missing store_id"}), 400

#     allowed_fields = [
#         "store_code", "name", "lat", "long",
#         "address", "city", "state", "country", "capacity_units"
#     ]
#     updates = {k: data[k] for k in allowed_fields if k in data}
#     if not updates:
#         return jsonify({"error": "No fields to update"}), 400

#     try:
#         response = supabase.table("store_data") \
#             .update(updates) \
#             .eq("store_id", store_id) \
#             .eq("role_user_id", user_id) \
#             .execute()

#         # Check if the update actually returned something
#         if not response.data:
#             return jsonify({"error": "Update failed or no matching store found"}), 404

#         return jsonify({"message": "Store updated successfully"}), 200

#     except Exception as e:
#         return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


from flask import Blueprint, request, jsonify, g
from supabase import create_client, Client
from datetime import datetime, timezone
from collections import defaultdict
import os
from dotenv import load_dotenv
from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required

# Load environment variables from .env
load_dotenv()

# Supabase initialization
SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, ANON_KEY)

# Flask Blueprint
bp = Blueprint("node_location_update", __name__)

def fetch_allstores_data():
    response = (
        supabase.table("store_data")
        .select("store_name")
        .execute()
    )
    if response.status_code == 200:
        return response.data
    return []

def user_choice(store_name, new_location):
    response = (
        supabase.table("store_data")
        .update({"location": new_location})
        .eq("name", store_name)
        .execute()
    )
    if response.status_code == 200:
        print("Node Location changed")
        return True
    else:
        print("Failed to update location")
        return False

# Route to update location
@bp.route("/update_store", methods=["POST", "OPTIONS"])
@role_required
def update_store():
    # Handle CORS preflight request
    if request.method == "OPTIONS":
        return jsonify({}), 200
   
    try:
        user_id = g.user_id
        data = request.get_json()
       
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
       
        store_id = data.get("store_id")
        if not store_id:
            return jsonify({"error": "Missing store_id"}), 400
       
        # Convert store_id to integer if it's a string
        try:
            store_id = int(store_id)
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid store_id format"}), 400
       
        # Define allowed fields for update
        allowed_fields = [
            "store_code", "name", "lat", "long",
            "address", "city", "state", "country", "capacity_units"
        ]
       
        # Build the updates dictionary with only allowed fields that exist in the request
        updates = {}
        for field in allowed_fields:
            if field in data:
                value = data[field]
               
                # Handle numeric fields - convert empty strings to None
                if field in ["lat", "long", "capacity_units"]:
                    if value == "" or value is None:
                        updates[field] = None
                    else:
                        try:
                            updates[field] = float(value)
                        except (ValueError, TypeError):
                            return jsonify({"error": f"Invalid numeric value for {field}"}), 400
                else:
                    # Handle string fields - convert empty strings to None for optional fields
                    if field in ["state", "country"] and value == "":
                        updates[field] = None
                    else:
                        updates[field] = value if value != "" else None
       
        if not updates:
            return jsonify({"error": "No valid fields to update"}), 400
       
        # Log the update attempt for debugging
        print(f"Attempting to update store {store_id} for user {user_id} with data: {updates}")
       
        # Perform the update
        response = supabase.table("store_data") \
            .update(updates) \
            .eq("store_id", store_id) \
            .eq("role_user_id", user_id) \
            .execute()
       
        # Check if the update was successful
        if not response.data:
            return jsonify({"error": "Update failed: Store not found or you don't have permission to update it"}), 404
       
        print(f"Store {store_id} updated successfully: {response.data}")
        return jsonify({
            "message": "Store updated successfully",
            "updated_store": response.data[0] if response.data else None
        }), 200
       
    except Exception as e:
        print(f"Unexpected error in update_store: {str(e)}")
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

