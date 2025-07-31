from app import db
from sqlalchemy.orm import relationship
from sqlalchemy import Boolean
import uuid

class User(db.Model):
    __tablename__ = 'user'

    role_user_id = db.Column(db.String, primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    active = db.Column(Boolean, default=True)

    lookahead_days = db.Column(db.Integer, default=7)

    role = relationship("Role", back_populates="users")
