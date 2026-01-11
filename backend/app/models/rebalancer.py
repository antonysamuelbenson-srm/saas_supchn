from app import db
from datetime import date

class RebalancerDetail(db.Model):
    __tablename__ = "rebalancer"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    src_store_code = db.Column(db.String(50), nullable=False)
    src_store_name = db.Column(db.String(100), nullable=False)
    dst_store_code = db.Column(db.String(50), nullable=False)
    dst_store_name = db.Column(db.String(100), nullable=False)
    sku = db.Column(db.String(50), nullable=False)
    product_name = db.Column(db.String(150), nullable=False)
    units = db.Column(db.Integer, nullable=False)
    src_current_inventory = db.Column(db.Integer, nullable=False)
    dst_current_inventory = db.Column(db.Integer, nullable=False)
    src_days_of_supply = db.Column(db.Float, nullable=False)
    dst_days_of_supply = db.Column(db.Float, nullable=False)
    src_daily_forecast = db.Column(db.Float, nullable=False)
    dst_daily_forecast = db.Column(db.Float, nullable=False)
    src_excess = db.Column(db.Integer, nullable=False)
    dst_shortage = db.Column(db.Integer, nullable=False)
    network_deficit = db.Column(db.Integer, nullable=False)
    ddos_shortage = db.Column(db.Integer, nullable=False)
    total_unfulfilled_shortage = db.Column(db.Integer, nullable=False)
    arrival_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.Date, default=date.today, nullable=False)

    def __repr__(self):
        return f"<RebalancerDetail {self.src_store_code}->{self.dst_store_code} SKU={self.sku}>"
