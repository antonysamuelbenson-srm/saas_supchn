

from app import db
import uuid

class InventorySnapshot(db.Model):
    __tablename__ = 'inventory_snapshot'

    role_user_id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sku = db.Column(db.String, nullable=False)
    store_code = db.Column(db.String)  # ✅ added
    product_name = db.Column(db.String)  # ✅ added
    quantity = db.Column(db.Integer)  # ✅ added
    last_updated = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
