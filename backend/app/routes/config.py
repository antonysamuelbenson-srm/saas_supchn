from flask import Blueprint, request, jsonify
# from app.models.node import Node
from app.utils.threshold_calc import update_reorder_config
from app.models.reorder_config import ReorderConfig
from app.models.user import User  # or wherever your User is defined
from app.utils.kpi_calc import generate_alerts
from app.utils.jwt_utils import decode_jwt
from app import db
from app.utils.decorators import role_required

bp = Blueprint("config", __name__)

# 📋 Available formulas
FORMULAS = {
    "default": "reorder_point = avg_daily_usage × lead_time + safety_stock",
    "aggressive": "reorder_point = avg_daily_usage × lead_time",
    "conservative": "reorder_point = (avg_daily_usage × lead_time) + 2 × safety_stock"
}

# 🚩 Recalculate thresholds (default formula)
@bp.route("/config/recalculate-thresholds", methods=["POST"])
@role_required
def recalc_thresholds():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        updated = update_reorder_config(None, formula="default")
        return jsonify({"message": f"Thresholds updated for {updated} SKUs"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 🚩 Get available formulas
@bp.route("/config/formulas", methods=["GET"])
@role_required
def list_formulas():
    try:
        return jsonify(FORMULAS), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🚩 Apply a chosen formula
@bp.route("/config/apply-formula", methods=["POST"])
@role_required
def apply_formula():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        chosen_formula = request.json.get("formula")
        store_ids      = request.json.get("store_ids") 
        if chosen_formula not in FORMULAS:
            return jsonify({"error": "Invalid formula choice"}), 400

        updated = update_reorder_config(None, formula=chosen_formula, store_ids=store_ids)
        alerts_count = generate_alerts(None)


        return jsonify({
            "message": f"Applied formula '{chosen_formula}' and updated thresholds & alerts.",
            "updated_skus": updated,
            "alerts_triggered": alerts_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/config/update-lead-times", methods=["POST"])
@role_required
def update_lead_times():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        data = request.json  # expected format: { "lead_times": [ { "store_id": 1, "lead_time": 10 }, ... ] }
        lead_time_entries = data.get("lead_times", [])
        default_lead_time = 7  # fallback if not provided in any entry

        updated_count = 0
        for entry in lead_time_entries:
            store_id = entry.get("store_id")
            lead_time = entry.get("lead_time", default_lead_time)

            configs = db.session.query(ReorderConfig).filter_by(
                store_id=store_id
            ).all()


            for config in configs:
                config.lead_time_days = lead_time
                updated_count += 1

        db.session.commit()

        return jsonify({
            "message": f"Updated lead times for {updated_count} items across all SKUs.",
            "default_used_for_missing": default_lead_time
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/config/set-lookahead-days", methods=["POST"])
@role_required
def set_lookahead_days():
    # 1. Extract token
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    # 2. Unauthorized if missing
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # 3. Extract data from JSON body
    data = request.get_json()
    lookahead = data.get("lookahead_days")

    if lookahead is None:
        return jsonify({"error": "Missing lookahead_days"}), 400

    try:
        # 4. Find the user by role_user_id
        user = User.query.filter_by(role_user_id=role_user_id).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        # 5. Update lookahead_days
        user.lookahead_days = lookahead
        db.session.commit()

        return jsonify({"message": "Lookahead set successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
