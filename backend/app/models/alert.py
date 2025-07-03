from app import db
import uuid
from datetime import datetime

class Alert(db.Model):
    __tablename__ = 'alert'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))  # ✅ Primary key
    role_user_id = db.Column(db.String, nullable=False)  # ✅ Foreign key to user table
    sku = db.Column(db.String, nullable=False)
    store_code = db.Column(db.String, nullable=False)
    type = db.Column(db.String, nullable=False)  # e.g., Stockout
    severity = db.Column(db.String, nullable=False, default="Medium")
    message = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
