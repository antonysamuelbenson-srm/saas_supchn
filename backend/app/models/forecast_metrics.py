import uuid
from sqlalchemy.dialects.postgresql import UUID
from app import db

class ForecastMetrics(db.Model):
    __tablename__ = "forecast_metrics"
    id = db.Column(db.Integer, primary_key=True)
    role_user_id = db.Column(UUID(as_uuid=True), nullable=False)  # UUID
    level = db.Column(db.String, nullable=False)  # store or store_sku
    store_id = db.Column(db.BigInteger)  
    sku = db.Column(db.String)
    n_days = db.Column(db.Integer, nullable=False)
    mape = db.Column(db.Float)
    smape = db.Column(db.Float)
    mae = db.Column(db.Float)
    rmse = db.Column(db.Float)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

