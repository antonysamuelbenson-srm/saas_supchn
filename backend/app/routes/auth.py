from flask import Blueprint, request, jsonify
from app import db
import uuid
from app.models.user import User
from flask_bcrypt import Bcrypt
from app.utils.jwt_utils import encode_jwt

bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

@bp.route("/register", methods=["POST"])
def register():
    data = request.json
    hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(
        email=data["email"],
        password=hashed_pw,
        role=data["role"],  # admin/planner
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
        token = encode_jwt({
            "email": user.email,
            "role": user.role,
            "role_user_id": str(user.role_user_id)
        })
        print(f"✅ Login success for {user.email}")
        return jsonify({"token": token})

    print(f"❌ Login failed for {data['email']}")
    return jsonify({"error": "Invalid credentials"}), 401