from app import db
from sqlalchemy.orm import relationship
import uuid

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")
