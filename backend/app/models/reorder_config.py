from app import db
import uuid

class ReorderConfig(db.Model):
    __tablename__ = 'reorder_config'

    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    role_user_id = db.Column(db.String, nullable=False)
    sku = db.Column(db.String, nullable=False)
    avg_daily_usage = db.Column(db.Float)
    lead_time_days = db.Column(db.Integer)
    safety_stock = db.Column(db.Float)
    reorder_point = db.Column(db.Float)


