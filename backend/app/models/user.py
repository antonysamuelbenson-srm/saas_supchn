from app import db
import uuid

class User(db.Model):
    __tablename__ = 'user'  # Explicit table name for clarity

    role_user_id = db.Column(db.String, primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False)  # e.g., "admin", "planner"


