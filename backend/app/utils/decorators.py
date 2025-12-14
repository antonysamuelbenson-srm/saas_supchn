# # app/utils/decorators.py
# from functools import wraps
# from flask import request, jsonify
# from app.utils.jwt_utils import decode_jwt
# from app.models.user import User
# from app.models.roles import Role
# from app import db
# import logging

# logger = logging.getLogger(__name__)

# def token_required(f):
#     """
#     Decorator to require a valid JWT token
#     """
#     @wraps(f)
#     def decorated(*args, **kwargs):
#         token = request.headers.get('Authorization')
        
#         if not token:
#             return jsonify({'error': 'Token is missing'}), 401
            
#         try:
#             if token.startswith('Bearer '):
#                 token = token[7:]  # Remove 'Bearer ' prefix
                
#             payload = decode_jwt(token)
            
#             # Verify user exists and is active
#             user = User.query.filter_by(email=payload['email']).first()
#             if not user or not user.active:
#                 return jsonify({'error': 'Invalid or inactive user'}), 401
                
#             # Add user info to request context for use in the route
#             request.current_user = user
#             request.current_payload = payload
            
#         except Exception as e:
#             logger.error(f"Token validation failed: {str(e)}")
#             return jsonify({'error': 'Token is invalid'}), 401
            
#         return f(*args, **kwargs)
#     return decorated

# def role_required(allowed_roles=None):
#     """
#     Decorator to require specific roles
    
#     Usage:
#     @role_required(['admin', 'manager'])
#     @role_required('admin')  # Single role
#     @role_required()  # Any authenticated user (same as token_required)
#     """
#     def decorator(f):
#         @wraps(f)
#         @token_required  # This ensures token validation happens first
#         def decorated(*args, **kwargs):
#             # If no specific roles required, just need to be authenticated
#             if not allowed_roles:
#                 return f(*args, **kwargs)
            
#             try:
#                 user = request.current_user
#                 role = Role.query.get(user.role_id)
                
#                 if not role:
#                     return jsonify({'error': 'User role not found'}), 403
                
#                 # Handle both string and list inputs
#                 if isinstance(allowed_roles, str):
#                     required_roles = [allowed_roles]
#                 elif isinstance(allowed_roles, list):
#                     required_roles = allowed_roles
#                 else:
#                     logger.error(f"Invalid allowed_roles type: {type(allowed_roles)}")
#                     return jsonify({'error': 'Server configuration error'}), 500
                
#                 # Check if user's role is in the allowed roles
#                 if role.role not in required_roles:
#                     return jsonify({
#                         'error': f'Insufficient permissions. Required: {required_roles}, Current: {role.role}'
#                     }), 403
                    
#             except Exception as e:
#                 logger.error(f"Role validation failed: {str(e)}")
#                 return jsonify({'error': 'Permission validation failed'}), 403
                
#             return f(*args, **kwargs)
#         return decorated
    
#     # Handle the case where decorator is used without parentheses
#     if callable(allowed_roles):
#         # @role_required (without parentheses)
#         func = allowed_roles
#         allowed_roles = None
#         return decorator(func)
#     else:
#         # @role_required() or @role_required(['admin'])
#         return decorator

# def admin_required(f):
#     """
#     Decorator to require admin role specifically
#     """
#     @wraps(f)
#     @role_required(['admin'])
#     def decorated(*args, **kwargs):
#         return f(*args, **kwargs)
#     return decorated

# def manager_or_admin_required(f):
#     """
#     Decorator to require manager or admin role
#     """
#     @wraps(f)
#     @role_required(['admin', 'manager'])
#     def decorated(*args, **kwargs):
#         return f(*args, **kwargs)
#     return decorated




# app/utils/decorators.py
from functools import wraps
from flask import request, jsonify, make_response
from app.utils.jwt_utils import decode_jwt
from app.models.user import User
from app.models.roles import Role
from app import db
import logging

logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator to require a valid JWT token.
    Intercepts OPTIONS requests to ensure successful CORS preflight.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # ✅ FIX: Return 200 OK immediately for OPTIONS (Preflight)
        # We do NOT call f(*args, **kwargs) here, because the route logic 
        # might try to read the missing token and crash.
        if request.method == "OPTIONS":
            response = make_response()
            response.status_code = 200
            return response

        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
            
        try:
            if token.startswith('Bearer '):
                token = token[7:]  # Remove 'Bearer ' prefix
                
            payload = decode_jwt(token)
            
            # Verify user exists and is active
            user = User.query.filter_by(email=payload['email']).first()
            if not user or not user.active:
                return jsonify({'error': 'Invalid or inactive user'}), 401
                
            # Add user info to request context
            request.current_user = user
            request.current_payload = payload
            
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles=None):
    """
    Decorator to require specific roles.
    """
    def decorator(f):
        @wraps(f)
        @token_required  # This runs first and handles the OPTIONS check
        def decorated(*args, **kwargs):
            # OPTIONS check is already handled by @token_required, 
            # but strictly safe to keep a check here just in case.
            if request.method == "OPTIONS":
                response = make_response()
                response.status_code = 200
                return response

            # If no specific roles required, pass through
            if not allowed_roles:
                return f(*args, **kwargs)
            
            try:
                user = request.current_user
                role = Role.query.get(user.role_id)
                
                if not role:
                    return jsonify({'error': 'User role not found'}), 403
                
                if isinstance(allowed_roles, str):
                    required_roles = [allowed_roles]
                elif isinstance(allowed_roles, list):
                    required_roles = allowed_roles
                else:
                    logger.error(f"Invalid allowed_roles type: {type(allowed_roles)}")
                    return jsonify({'error': 'Server configuration error'}), 500
                
                if role.role not in required_roles:
                    return jsonify({
                        'error': f'Insufficient permissions. Required: {required_roles}, Current: {role.role}'
                    }), 403
                    
            except Exception as e:
                logger.error(f"Role validation failed: {str(e)}")
                return jsonify({'error': 'Permission validation failed'}), 403
                
            return f(*args, **kwargs)
        return decorated
    
    if callable(allowed_roles):
        func = allowed_roles
        allowed_roles = None
        return decorator(func)
    else:
        return decorator

# --- Helpers for specific roles ---
def admin_required(f):
    @wraps(f)
    @role_required(['admin'])
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated

def manager_or_admin_required(f):
    @wraps(f)
    @role_required(['admin', 'manager'])
    def decorated(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated