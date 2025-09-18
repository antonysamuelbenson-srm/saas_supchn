# In app/utils/jwt_utils.py

import jwt
import os
from flask import jsonify

# This is the standard library for JWT errors
from jwt.exceptions import PyJWTError

def encode_jwt(payload):
    """
    Encodes the given payload into a JWT.
    The expiration ('exp') should be set inside the payload itself.
    """
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise Exception("SECRET_KEY is not set in environment variables")
    
    return jwt.encode(payload, secret_key, algorithm="HS256")


def decode_jwt(token):
    """
    Decodes a JWT. Returns the payload if successful, None otherwise.
    """
    secret_key = os.getenv("SECRET_KEY")
    print(f"\n--- 🔑 [jwt_utils.py] DECODING with key: '{secret_key}' ---\n")
    
    if not secret_key:
        return None
        
    try:
        # This will automatically handle expired tokens
        return jwt.decode(token, secret_key, algorithms=["HS256"])
    except PyJWTError as e:
        # It's good practice to log the error
        print(f"JWT Decode Error: {e}")
        return None