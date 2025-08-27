from app import db

class Sales(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.Date, nullable=False)
    sku = db.Column(db.String(50), nullable=False)
    store_id = db.Column(db.String(50), nullable=False)
    units_sold = db.Column(db.Integer, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("date", "sku", "store_id", name="uix_sales_store_product_date"),
    )

    def __repr__(self):
        return f"<Sales store={self.store_id} product={self.sku} date={self.date} units={self.units_sold}>"

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.strftime("%Y-%m-%d"),
            "sku": self.product_id,
            "store_id": self.store_id,
            "units_sold": self.units_sold
        }
