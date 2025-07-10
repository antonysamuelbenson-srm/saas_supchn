from flask import Blueprint, request, jsonify
from app.models.node import Node
from app.utils.threshold_calc import update_reorder_config
from app.utils.kpi_calc import generate_alerts
from app.utils.jwt_utils import decode_jwt
from app import db

bp = Blueprint("config", __name__)

# 📋 Available formulas
FORMULAS = {
    "default": "reorder_point = avg_daily_usage × lead_time + safety_stock",
    "aggressive": "reorder_point = avg_daily_usage × lead_time",
    "conservative": "reorder_point = (avg_daily_usage × lead_time) + 2 × safety_stock"
}


# 🚩 Add a new node (store/warehouse)
@bp.route("/nodes", methods=["POST"])
def add_node():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        data = request.json
        node = Node(
            name=data["name"],
            type=data["type"],
            role_user_id=role_user_id  # optional
        )
        db.session.add(node)
        db.session.commit()
        return jsonify({"msg": "Node added"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 🚩 Recalculate thresholds (default formula)
@bp.route("/config/recalculate-thresholds", methods=["POST"])
def recalc_thresholds():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        updated = update_reorder_config(role_user_id, formula="default")
        return jsonify({"message": f"Thresholds updated for {updated} SKUs"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# 🚩 Get available formulas
@bp.route("/config/formulas", methods=["GET"])
def list_formulas():
    try:
        return jsonify(FORMULAS), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 🚩 Apply a chosen formula
@bp.route("/config/apply-formula", methods=["POST"])
def apply_formula():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        chosen_formula = request.json.get("formula")
        if chosen_formula not in FORMULAS:
            return jsonify({"error": "Invalid formula choice"}), 400

        updated = update_reorder_config(role_user_id, formula=chosen_formula)
        alerts_count = generate_alerts(role_user_id)

        return jsonify({
            "message": f"Applied formula '{chosen_formula}' and updated thresholds & alerts.",
            "updated_skus": updated,
            "alerts_triggered": alerts_count
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
