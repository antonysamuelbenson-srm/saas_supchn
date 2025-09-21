# In your auth routes file (e.g., app/routes/auth.py)

from flask import Blueprint, request, jsonify
from app import db
import uuid
from app.models.user import User
from app.models.roles import Role
from flask_bcrypt import Bcrypt
from app.utils.jwt_utils import encode_jwt, decode_jwt
 # We still need decode_jwt
from app.utils.decorators import role_required
from app.routes.role_map import ROUTE_ROLE_MAP
from datetime import datetime, timedelta
import jwt # 👈 1. IMPORT the standard jwt library
import os  # 👈 2. IMPORT os to get the secret key

bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

# ... (your /register route is fine) ...
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
        role_user_id=str(uuid.uuid4())
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered"})
@bp.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()

    if user and bcrypt.check_password_hash(user.password, data["password"]):
        role = Role.query.get(user.role_id)
        
        # We define the payload, including the expiration, here.
        payload = {
            "email": user.email,
            "role_id": user.role_id,
            "role": role.role,
            "role_user_id": str(user.role_user_id),
            "active": user.active,
            "exp": datetime.utcnow() + timedelta(hours=8)
        }
        
        try:
            secret_key = os.getenv('SECRET_KEY')
            
            # 👇 ADD THIS LINE
            print(f"\n--- 🔑 [auth.py] ENCODING with key: '{secret_key}' ---\n")
            
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            
            return jsonify({ "token": token, "role_user_id": str(user.role_user_id) })
        except Exception as e:
            return jsonify({"error": f"Token encoding error: {str(e)}"}), 500
        
    return jsonify({"error": "Invalid credentials"}), 401

# ... (your /user/permissions route is fine) ...
@bp.route("/user/permissions", methods=["GET"])
@role_required
def user_permissions():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        payload = decode_jwt(token)
        user = User.query.filter_by(email=payload["email"]).first()
        if not user or not user.active:
            return jsonify({"role": None, "allowed_routes": []}), 404
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
