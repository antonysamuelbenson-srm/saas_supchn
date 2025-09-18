from flask import Blueprint, request, jsonify
from supabase import create_client
from app.utils.jwt_utils import decode_jwt
from collections import defaultdict
import os
from dotenv import load_dotenv
from app.utils.decorators import role_required

load_dotenv()

bp = Blueprint("forecast", __name__)

# Supabase client
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["ANON_KEY"])


from datetime import date, timedelta
from flask import request
@bp.route("/forecast/store/<int:store_id>", methods=["GET"])
@role_required
def forecast_for_store(store_id):
    """
    Returns forecast data for a specific store — grouped by SKU & date.
    Accepts optional query param: days=7 (lookahead days)
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # STEP 1: Check query param or fallback to stored setting
    days_param = request.args.get("days")
    if days_param is not None:
        try:
            days = int(days_param)
        except ValueError:
            return jsonify({"error": "Invalid 'days' parameter"}), 400
    else:
        # Get stored lookahead_days from Supabase user profile
        user_profile = (
            supabase.table("user")
            .select("lookahead_days")
            .eq("role_user_id", role_user_id)
            .maybe_single()
            .execute()
        ).data
        days = int(user_profile.get("lookahead_days", 7))  # default to 7 if not found

    # STEP 2: Check if store belongs to this user
    store_check = (
        supabase.table("store_data")
        .select("store_id")
        .eq("store_id", store_id)
        .maybe_single()
        .execute()
    ).data

    if not store_check:
        return jsonify({"error": "Store not found"}), 404

    # STEP 3: Get forecast within range
    today = date.today()
    end_date = today + timedelta(days=days)

    forecast_rows = (
        supabase.table("forecast_daily")
        .select("forecast_date,sku,forecast_qty")
        .eq("store_id", store_id)
        .gte("forecast_date", today.isoformat())
        .lte("forecast_date", end_date.isoformat())
        .order("forecast_date")
        .execute()
    ).data or []

    forecast_data = defaultdict(list)
    for row in forecast_rows:
        forecast_data[row["sku"]].append({
            "date": row["forecast_date"],
            "forecast_qty": float(row["forecast_qty"])
        })

    return jsonify({
        "store_id": store_id,
        "forecast": forecast_data
    }), 200

@bp.route("/user/lookahead_days", methods=["POST", "OPTIONS"])
@role_required
def update_lookahead_days():
    if request.method == "OPTIONS":
        # Preflight for CORS
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response, 200

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    lookahead_days = data.get("lookahead_days")

    if not isinstance(lookahead_days, int) or lookahead_days <= 0:
        return jsonify({"error": "Invalid days value"}), 400

    try:
        supabase.table("user").update({
            "lookahead_days": lookahead_days
        }).eq("role_user_id", role_user_id).execute()
        return jsonify({"message": "Lookahead days updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@bp.route("/user/lookahead_days", methods=["GET"])
@role_required
def get_lookahead_days():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user_row = (supabase.table("user")
                        .select("lookahead_days")
                        .eq("role_user_id", role_user_id)
                        .single()
                        .execute()).data

    return jsonify({
        "lookahead_days": user_row.get("lookahead_days", 7)
    }), 200
