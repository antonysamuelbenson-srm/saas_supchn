from app import db
from sqlalchemy import UniqueConstraint
import uuid

class totalStoreData(db.Model):
    __tablename__ = "total_store_data"

    sku = db.Column(db.String, primary_key=True)
    node_name = db.Column(db.String(100), nullable=False)
    safety_stock_level = db.Column(db.Integer)
    reorder_level = db.Column(db.Integer)

    __table_args__ = (
        UniqueConstraint("node_name", "sku", name="uniq_total_store_data"),
    )

