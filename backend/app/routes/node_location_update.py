from flask import Blueprint, request, jsonify
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
@bp.route("/update_store", methods=["POST"])
@role_required
def update_store():
    data = request.get_json()
    store_id = data.get("store_id")
    if not store_id:
        return jsonify({"error": "Missing store_id"}), 400

    allowed_fields = [
        "store_code", "name", "lat", "long",
        "address", "city", "state", "country", "capacity_units"
    ]
    updates = {k: data[k] for k in allowed_fields if k in data}
    if not updates:
        return jsonify({"error": "No fields to update"}), 400

    try:
        response = supabase.table("store_data") \
            .update(updates) \
            .eq("store_id", store_id) \
            .execute()

        # Check if the update actually returned something
        if not response.data:
            return jsonify({"error": "Update failed or no matching store found"}), 404

        return jsonify({"message": "Store updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
