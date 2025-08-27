from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class ForecastLog(db.Model):
    __tablename__ = "forecast_log"

    # id = db.Column(db.Integer, primary_key=True)
    id = db.Column(UUID(as_uuid=True),primary_key=True)
    run_time = db.Column(db.DateTime, nullable=False)
    store_id = db.Column(db.String(50), nullable=True)
    product_id = db.Column(db.String(50), nullable=True)
    n_weeks = db.Column(db.Integer, nullable=False)

    schedule_id = db.Column(UUID(as_uuid=True), nullable=True)
    run_started_at = db.Column(db.DateTime, nullable=True)
    run_completed_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return (
            f"<ForecastLog id={self.id} store={self.store_id} sku={self.product_id} "
            f"run_time={self.run_time} status={self.status}>"
        )

    def to_dict(self):
        return {
            "id": self.id,
            "run_time": self.run_time.strftime("%Y-%m-%d %H:%M:%S") if self.run_time else None,
            "store_id": self.store_id,
            "product_id": self.product_id,
            "n_weeks": self.n_days,
            "schedule_id": str(self.schedule_id) if self.schedule_id else None,
            "run_started_at": self.run_started_at.strftime("%Y-%m-%d %H:%M:%S") if self.run_started_at else None,
            "run_completed_at": self.run_completed_at.strftime("%Y-%m-%d %H:%M:%S") if self.run_completed_at else None,
            "status": self.status
        }
