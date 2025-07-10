from app import db
import uuid

class Store(db.Model):
    __tablename__ = 'stores'

    role_user_id = db.Column(db.String, db.ForeignKey('user.role_user_id'), nullable=False)
    store_id = db.Column(db.Integer, primary_key=True, autoincrement=True)  
    store_name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(150), nullable=True)
    
    sku = db.Column(db.String(100), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)


    __table_args__ = (
        db.UniqueConstraint('store_name', 'location', 'sku', 'role_user_id', name='uq_store_entry'),
    )