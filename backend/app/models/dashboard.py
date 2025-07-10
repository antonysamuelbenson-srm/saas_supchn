from app import db
import uuid
from datetime import datetime

class DashboardMetrics(db.Model):
    __tablename__ = 'dashboard_metrics'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))  # ✅ Required PK
    
    role_user_id = db.Column(db.String, db.ForeignKey('user.role_user_id'), nullable=False)

    current_demand = db.Column(db.Integer)
    inventory_position = db.Column(db.Integer)
    weeks_of_supply = db.Column(db.Float)
    # stockouts = db.Column(db.Integer) will calculate on the go
    # skus_below_threshold = db.Column(db.Integer) will calculate on the go
    # inventory_turnover = db.Column(db.Float)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow)  # Optional, helpful for analytics
