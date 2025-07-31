from app import db
import uuid
from datetime import datetime

class DashboardMetrics(db.Model):
    __tablename__ = 'dashboard_metrics'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))  # ✅ Required PK
    projected_stockouts = db.Column(db.Integer)
    # current_demand = db.Column(db.Integer) will be user specific coz of lookahead days
    inventory_position = db.Column(db.Integer)
    weeks_of_supply = db.Column(db.Float)
    fill_rate_probability = db.Column(db.Float)


    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Optional, helpful for analytics
