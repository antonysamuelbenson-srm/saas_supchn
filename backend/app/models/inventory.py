from app import db
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import UniqueConstraint

class InventorySnapshot(db.Model):
    __tablename__ = 'inventory'

    snapshot_id = db.Column(db.Integer, primary_key=True)
    role_user_id = db.Column(
        PG_UUID(as_uuid=True),
        db.ForeignKey("user.role_user_id"),
        nullable=False
    )
    snapshot_date = db.Column(db.Date, nullable=False)

    store_id = db.Column(db.Integer, db.ForeignKey('store_data.store_id'), nullable=False)
    sku = db.Column(db.String, nullable=False)
    product_name = db.Column(db.String, nullable=False)
    qty = db.Column(db.Integer, nullable=False)

    store = db.relationship("Store", backref="inventory_snapshots")

    __table_args__ = (
        UniqueConstraint("snapshot_date", "store_id", "sku", name="uniq_inventory_entry"),
    )
