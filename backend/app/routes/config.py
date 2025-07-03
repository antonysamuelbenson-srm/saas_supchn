from flask import Blueprint, request, jsonify
from app.models.node import Node
from app.utils.threshold_calc import update_reorder_config
from app.utils.jwt_utils import decode_jwt
from app import db

bp = Blueprint("config", __name__)

@bp.route("/nodes", methods=["POST"])
def add_node():
    data = request.json
    node = Node(name=data["name"], type=data["type"])
    db.session.add(node)
    db.session.commit()
    return jsonify({"msg": "Node added"})


@bp.route("/config/recalculate-thresholds", methods=["POST"])
def recalc_thresholds():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    updated = update_reorder_config(role_user_id)
    return jsonify({"message": f"Thresholds updated for {updated} SKUs"})

