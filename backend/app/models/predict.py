from app import db
from sqlalchemy import UUID
from datetime import datetime

class ForecastDaily(db.Model):
    __tablename__ = "predict"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    forecast_log_id = db.Column(UUID(as_uuid=True), db.ForeignKey("forecast_log.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    store_id = db.Column(db.String(50), nullable=True)
    product_id = db.Column(db.String(50), nullable=True)
    predicted = db.Column(db.Float, nullable=False)
    actual = db.Column(db.Float, nullable=True)  # can be NULL until actual data arrives
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    def __repr__(self):
        return f"<ForecastDaily date={self.date} store={self.store_id} sku={self.product_id} pred={self.predicted} actual={self.actual}>"

    def to_dict(self):
        return {
            "id": self.id,
            "forecast_log_id": self.forecast_log_id,
            "date": self.date.strftime("%Y-%m-%d"),
            "store_id": self.store_id,
            "product_id": self.product_id,
            "predicted": self.predicted,
            "actual": self.actual
        }
