from flask import Blueprint, jsonify
from app.models.dashboard import DashboardMetrics

bp = Blueprint("dashboard", __name__)

# app/routes/dashboard.py

from flask import Blueprint, request, jsonify
from app.models.dashboard import DashboardMetrics
from app.utils.jwt_utils import decode_jwt

bp = Blueprint("dashboard", __name__)

@bp.route("/dashboard", methods=["GET"])
def get_dashboard():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")
    except Exception:
        return jsonify({"error": "Invalid token"}), 401

    # Fetch metrics for the logged-in user
    metrics = DashboardMetrics.query.filter_by(role_user_id=role_user_id).order_by(DashboardMetrics.timestamp.desc()).first()

    if not metrics:
        return jsonify({"error": "No dashboard data found for user"}), 404

    return jsonify({
        "current_demand": metrics.current_demand,
        "inventory_position": metrics.inventory_position,
        "weeks_of_supply": metrics.weeks_of_supply,
        "timestamp": str(metrics.timestamp)
    })

