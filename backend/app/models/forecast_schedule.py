from app import db
from datetime import datetime
import uuid
from sqlalchemy.dialects.postgresql import UUID

class ForecastSchedule(db.Model):
    __tablename__ = "forecast_schedule"

    

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = db.Column(db.String, nullable=True)     # null = run for all stores
    product_id = db.Column(db.String, nullable=True)       # null = run for all SKUs
    frequency = db.Column(db.String, nullable=False)   # "hourly", "daily", "weekly"
    time_of_day = db.Column(db.String, nullable=True)  # "HH:MM" for daily/weekly
    day_of_week = db.Column(db.String, nullable=True)  # "monday", etc. for weekly
    n_weeks = db.Column(db.Integer, default=7)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
