from app import db
import uuid
from datetime import datetime

class AvailabilityRate(db.Model):
    __tablename__ = "availability_rate"

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    week_start = db.Column(db.Date, nullable=False, unique=True)
    availability_rate = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
