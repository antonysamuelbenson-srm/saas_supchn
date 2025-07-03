from flask import Blueprint, request, jsonify
from app.models.alert import Alert
from app.utils.jwt_utils import decode_jwt  # ✅ Make sure this is correct

bp = Blueprint("alerts", __name__)

@bp.route("/alerts", methods=["GET"])
def get_alerts():
    # ✅ Extract token and decode user
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # ✅ Return only alerts for this user
    alerts = Alert.query.filter_by(role_user_id=role_user_id).order_by(Alert.created_at.desc()).all()
    return jsonify([
        {
            "type": a.type,
            "severity": a.severity,
            "message": a.message,
            "sku": a.sku,
            "store_code": a.store_code,
            "created_at": a.created_at.isoformat()
        }
        for a in alerts
    ])
