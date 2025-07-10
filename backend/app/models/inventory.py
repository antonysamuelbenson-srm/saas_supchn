

from app import db
import uuid

class InventorySnapshot(db.Model):
    __tablename__ = 'inventory_snapshot'

    role_user_id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id = db.Column(db.Integer, db.ForeignKey('stores.store_id'))  #added now
    store = db.relationship('Store', backref='inventory_snapshots')

    sku = db.Column(db.String, nullable=False)
    product_name = db.Column(db.String)  # ✅ added

    store_name = db.Column(db.String)  # ✅ added
    store_location = db.Column(db.String)  # ✅ added
    quantity = db.Column(db.Integer)  # ✅ added
    last_updated = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    __table_args__ = (
    db.UniqueConstraint('sku', 'role_user_id', name='uq_sku_user'),
)

    
