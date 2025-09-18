import jwt, os
from datetime import datetime, timedelta




def encode_jwt(payload):
    return jwt.encode({**payload, "exp": datetime.utcnow() + timedelta(days=1)}, os.getenv("SECRET_KEY"), algorithm="HS256")

def decode_jwt(token):
    try:
        return jwt.decode(token, os.getenv("SECRET_KEY"), algorithms=["HS256"])
    except:
        return None
