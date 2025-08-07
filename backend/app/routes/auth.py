from flask import Blueprint, request, jsonify
from app import db
import uuid
from app.models.user import User
from app.models.roles import Role
from flask_bcrypt import Bcrypt
from app.utils.jwt_utils import encode_jwt,decode_jwt
from app.utils.decorators import role_required
from app.routes.role_map import ROUTE_ROLE_MAP

bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

@bp.route("/register", methods=["POST"])
def register():
    data = request.json
    role = Role.query.filter_by(role="viewer").first()
    if not role:
        return jsonify({"error": "viewer role not found in DB"}), 500

    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        email=data["email"],
        password=hashed_pw,
        role_id=role.id,
        role_user_id=str(uuid.uuid4())  # unique ID for ownership
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered"})


from flask import jsonify

@bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()

    if user and bcrypt.check_password_hash(user.password, data["password"]):
        role = Role.query.get(user.role_id)
        token = encode_jwt({
            "email": user.email,
            "role_id": user.role_id,  # Include role_id in the token
            "role": role.role,
            "role_user_id": str(user.role_user_id),  # ✅ convert UUID to str
            "active": user.active
        })
        print("Your token:", token)
        return jsonify({"token": token,
            "role_user_id": str(user.role_user_id)})
        
    return jsonify({"error": "Invalid credentials"}), 401

@bp.route("/user/permissions", methods=["GET"])
@role_required
def user_permissions():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        payload = decode_jwt(token)
        user = User.query.filter_by(email=payload["email"]).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        # ⛔ NEW: Check if user is deactivated
        if not user.active:
            return jsonify({"role": None, "allowed_routes": []})

        role = Role.query.get(user.role_id)
        if not role:
            return jsonify({"error": "Role not found"}), 404

        allowed_routes = sorted([
            route for route, roles in ROUTE_ROLE_MAP.items()
            if role.role in roles or "public" in roles
        ])

        return jsonify({"role": role.role, "allowed_routes": allowed_routes})

    except Exception as e:
        return jsonify({"error": f"Failed to fetch permissions: {str(e)}"}), 500