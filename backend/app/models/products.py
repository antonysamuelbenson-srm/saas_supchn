from app import db
class Products(db.Model):
    __tablename__ = "products"
    
    id = db.Column(db.Integer, primary_key=True)
    store_id = db.Column(db.Integer, nullable=False)
    sku = db.Column(db.String, nullable=False)
    product_name = db.Column(db.String, nullable=False)
