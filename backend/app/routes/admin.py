# app/routes/admin.py
from flask import Blueprint, request, jsonify
from app.models.user import User
from app.models.roles import Role
from app import db
from app.utils.decorators import admin_required

bp = Blueprint("admin", __name__)

@bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    status = request.args.get("status")  # e.g., "active", "deactivated"

    query = User.query
    if status == "active":
        query = query.filter_by(active=True)
    elif status == "deactivated":
        query = query.filter_by(active=False)

    users = query.all()

    return jsonify([{
        "email": user.email,
        "role": Role.query.get(user.role_id).role if Role else None,
        "role_user_id": user.role_user_id,
        "active": user.active  # 👈 ADD THIS
    } for user in users])

@bp.route("/user/<string:role_user_id>/role", methods=["PUT"])
@admin_required
def change_user_role(role_user_id):
    data = request.json
    new_role = data.get("role")
    role = Role.query.filter_by(role=new_role).first()
    if not role:
        return jsonify({"error": "Invalid role"}), 400

    user = User.query.filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.role_id = role.id
    db.session.commit()
    return jsonify({"message": f"User {user.email} role changed to {new_role}."})

@bp.route("/user/<string:role_user_id>", methods=["DELETE"])
@admin_required
def delete_user(role_user_id):
    user = User.query.filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.email} deleted."})

@bp.route("/user/<string:role_user_id>/deactivate", methods=["POST"])
@admin_required
def deactivate_user(role_user_id):
    user = User.query.get(role_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.active = False  # Add 'active' column in User model if needed
    db.session.commit()
    return jsonify({"message": f"User {user.email} deactivated."})


@bp.route("/user/<string:role_user_id>/reactivate", methods=["POST"])
@admin_required
def reactivate_user(role_user_id):
    user = User.query.get(role_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.active = True
    db.session.commit()
    return jsonify({"message": f"User {user.email} reactivated."})