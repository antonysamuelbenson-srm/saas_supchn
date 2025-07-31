from uuid import UUID
from sqlalchemy import BigInteger, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app import db


class Store(db.Model):
    __tablename__ = "store_data"

    # ── Foreign‑key back to your tenant / user table ──────────────────────────
    role_user_id = db.Column(
        PG_UUID(as_uuid=True),                           # uuid type in Postgres
        db.ForeignKey("user.role_user_id"),              # adjust table / col name if different
        nullable=False
    )

    # ── Primary key ───────────────────────────────────────────────────────────
    store_id = db.Column(BigInteger, primary_key=True, autoincrement=True)

    # ── Identifiers ───────────────────────────────────────────────────────────
    store_code = db.Column(db.String(50), nullable=False)  # human‑readable e.g. "NYC‑01"

    # ── Descriptive fields ────────────────────────────────────────────────────
    name        = db.Column(db.String(100), nullable=False)  # storefront name
    address     = db.Column(db.Text,         nullable=False)
    city        = db.Column(db.String(50),   nullable=False)
    state       = db.Column(db.String(50),   nullable=True)
    country     = db.Column(db.String(50),   nullable=True)

    # ── Geo & time zone ───────────────────────────────────────────────────────
    lat         = db.Column(Numeric(9, 6),   nullable=True)   #  ±90.000000
    long        = db.Column(Numeric(9, 6),   nullable=True)   # ±180.000000

    # ── Capacity (optional) ───────────────────────────────────────────────────
    capacity_units = db.Column(Numeric(12, 2), nullable=True)

    # ── Constraints ───────────────────────────────────────────────────────────
    __table_args__ = (
    UniqueConstraint("store_code", name="uq_store_code"),
)


    # ── Convenience ───────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<Store {self.store_code} ({self.name})>"
