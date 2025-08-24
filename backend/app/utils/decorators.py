from functools import wraps
from flask import request, jsonify
from app.utils.jwt_utils import decode_jwt
from app.models.roles import Role
from app.models.user import User
from werkzeug.routing import Map, Rule
from app.routes.role_map import ROUTE_ROLE_MAP 
from flask import g

_route_rules = []
for route_pattern in ROUTE_ROLE_MAP.keys():
    method, path_pattern = route_pattern.split(":", 1)
    _route_rules.append(
        Rule(path_pattern, methods=[method])
    )
_route_map = Map(_route_rules)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            payload = decode_jwt(token)
            user = User.query.filter_by(email=payload["email"]).first()
            role = Role.query.get(user.role_id)

            if not user or role.role != "admin":
                return jsonify({"error": "Admin access required"}), 403

        except Exception as e:
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401

        return f(*args, **kwargs)
    return decorated_function

# def role_required(f):
#     @wraps(f)
#     def wrapper(*args, **kwargs):
#         # ✅ Allow preflight requests (skip auth)
#         if request.method == "OPTIONS":
#             return jsonify({}), 200
#         token = request.headers.get("Authorization", "").replace("Bearer ", "")
#         if not token:
#             return jsonify({"error": "Missing token"}), 401

#         try:
#             payload = decode_jwt(token)
#             user = User.query.filter_by(email=payload["email"]).first()
#             if not user:
#                 return jsonify({"error": "User not found"}), 404

#             role_obj = Role.query.get(user.role_id)
#             if not role_obj:
#                 return jsonify({"error": "Role not found"}), 404
#             role = role_obj.role

#             #  # ✅ Save user_id in g for later use in routes
#             # g.user_id = user.role_user_id  # or `user.id` depending on your schema


#             adapter = _route_map.bind("", url_scheme=request.scheme)
#             try:
#                 rule, route_args = adapter.match(request.path, method=request.method, return_rule=True)
#                 matched_pattern = f"{request.method}:{rule.rule}"
#             except Exception:
#                 return jsonify({"error": "Route not protected or misconfigured"}), 403

#             allowed_roles = ROUTE_ROLE_MAP.get(matched_pattern, [])

#             if role not in allowed_roles and "public" not in allowed_roles:
#                 return jsonify({"error": f"{role.capitalize()} access forbidden for this route"}), 403

#             return f(*args, **kwargs)

#         except Exception as e:
#             return jsonify({"error": f"Token error: {str(e)}"}), 401

#     return wrapper


from flask import g, request, jsonify

def role_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        # Allow preflight OPTIONS requests through
        if request.method == "OPTIONS":
            return jsonify({"message": "CORS preflight allowed"}), 200

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            payload = decode_jwt(token)
            user = User.query.filter_by(email=payload["email"]).first()
            if not user:
                return jsonify({"error": "User not found"}), 404

            g.user_id = user.role_user_id
            g.email = user.email

            role_obj = Role.query.get(user.role_id)
            if not role_obj:
                return jsonify({"error": "Role not found"}), 404
            role = role_obj.role

            adapter = _route_map.bind("", url_scheme=request.scheme)
            try:
                rule, route_args = adapter.match(request.path, method=request.method, return_rule=True)
                matched_pattern = f"{request.method}:{rule.rule}"
            except Exception:
                return jsonify({"error": "Route not protected or misconfigured"}), 403

            allowed_roles = ROUTE_ROLE_MAP.get(matched_pattern, [])

            if role not in allowed_roles and "public" not in allowed_roles:
                return jsonify({"error": f"{role.capitalize()} access forbidden for this route"}), 403

            return f(*args, **kwargs)

        except Exception as e:
            return jsonify({"error": f"Token error: {str(e)}"}), 401

    return wrapper
