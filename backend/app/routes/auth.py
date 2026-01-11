from flask import Blueprint, request, jsonify
from app import db
import uuid
from app.models.user import User
from app.models.roles import Role
from flask_bcrypt import Bcrypt
from app.utils.jwt_utils import encode_jwt, decode_jwt
from app.routes.role_map import ROUTE_ROLE_MAP
from datetime import datetime, timedelta
import jwt
import os
import logging

bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()
logger = logging.getLogger(__name__)

def validate_token_helper():
    """Helper function to validate JWT token from request headers"""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None, jsonify({"error": "Authorization token required"}), 401
    
    try:
        payload = decode_jwt(token)
        user = User.query.filter_by(email=payload["email"]).first()
        if not user or not user.active:
            return None, jsonify({"error": "Invalid or inactive user"}), 401
        return payload, None, None
    except Exception as e:
        logger.error(f"Token validation failed: {str(e)}")
        return None, jsonify({"error": "Invalid token"}), 401

@bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        
        # Validate required fields
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password are required"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data["email"]).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409
        
        role = Role.query.filter_by(role="viewer").first()
        if not role:
            logger.error("Viewer role not found in database")
            return jsonify({"error": "Viewer role not found in DB"}), 500
            
        hashed_pw = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
        user = User(
            email=data["email"],
            password=hashed_pw,
            role_id=role.id,
            role_user_id=str(uuid.uuid4())
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({"message": "User registered successfully"}), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500

@bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        
        # Validate required fields
        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password are required"}), 400
        
        user = User.query.filter_by(email=data["email"]).first()

        if user and bcrypt.check_password_hash(user.password, data["password"]):
            # Check if user is active
            if not user.active:
                return jsonify({"error": "Account is deactivated"}), 401
                
            role = Role.query.get(user.role_id)
            if not role:
                logger.error(f"Role not found for user {user.email}")
                return jsonify({"error": "User role not found"}), 500
            
            payload = {
                "email": user.email,
                "role_id": user.role_id,
                "role": role.role,
                "role_user_id": str(user.role_user_id),
                "active": user.active,
                "exp": datetime.utcnow() + timedelta(hours=8)
            }
            
            try:
                # Use the JWT utility function for consistency
                token = encode_jwt(payload)
                
                return jsonify({
                    "token": token, 
                    "role_user_id": str(user.role_user_id),
                    "role": role.role,
                    "email": user.email
                }), 200
                
            except Exception as e:
                logger.error(f"Token encoding error: {str(e)}")
                return jsonify({"error": "Token generation failed"}), 500
            
        return jsonify({"error": "Invalid credentials"}), 401
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

@bp.route("/user/permissions", methods=["GET"])
def user_permissions():
    # Manual token validation
    payload, error_response, error_code = validate_token_helper()
    if error_response:
        return error_response, error_code
    
    try:
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
        
        return jsonify({
            "role": role.role, 
            "allowed_routes": allowed_routes,
            "user_id": str(user.role_user_id),
            "email": user.email
        }), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch permissions: {str(e)}")
        return jsonify({"error": "Failed to fetch permissions"}), 500

@bp.route("/logout", methods=["POST"])
def logout():
    """
    Logout endpoint - mainly for frontend to clear token
    In a stateless JWT system, actual logout is handled client-side
    """
    return jsonify({"message": "Logged out successfully"}), 200

@bp.route("/verify-token", methods=["POST"])
def verify_token():
    """
    Verify if a token is valid and return user info
    """
    # Manual token validation
    payload, error_response, error_code = validate_token_helper()
    if error_response:
        return jsonify({"valid": False, "error": "Token verification failed"}), 401
    
    try:
        user = User.query.filter_by(email=payload["email"]).first()
        role = Role.query.get(user.role_id)
        
        return jsonify({
            "valid": True,
            "user": {
                "email": user.email,
                "role": role.role if role else None,
                "role_user_id": str(user.role_user_id),
                "active": user.active
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({"valid": False, "error": "Token verification failed"}), 401

# Health check route for testing
@bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "OK", 
        "message": "Auth service is running",
        "timestamp": datetime.utcnow().isoformat()
    }), 200