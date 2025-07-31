from datetime import date
from sqlalchemy import BigInteger, Numeric, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import UniqueConstraint
from app import db


class ForecastDaily(db.Model):
    """
    Forward‑looking demand (one row per store/sku/day, 28‑day horizon).
    """
    __tablename__ = "forecast_daily"

    forecast_id = db.Column(BigInteger, primary_key=True, autoincrement=True)

    role_user_id = db.Column(
        PG_UUID(as_uuid=True),
        db.ForeignKey("user.role_user_id"),
        nullable=False
    )

    forecast_date = db.Column(Date, nullable=False)

    store_id = db.Column(
        BigInteger,
        db.ForeignKey("store_data.store_id", ondelete="CASCADE"),
        nullable=False
    )

    sku = db.Column(db.String(60), nullable=False)
    forecast_qty = db.Column(Numeric(12, 2), nullable=False)

    batch_id = db.Column(
        BigInteger,
        db.ForeignKey("upload_batch.batch_id", ondelete="RESTRICT"),
        nullable=False
    )

    __table_args__ = (
    UniqueConstraint("forecast_date", "store_id", "sku", name="uniq_forecast_entry"),
)


    def __repr__(self) -> str:
        return (
            f"<ForecastDaily {self.forecast_date} store={self.store_id} "
            f"sku={self.sku} qty={self.forecast_qty}>"
        )
