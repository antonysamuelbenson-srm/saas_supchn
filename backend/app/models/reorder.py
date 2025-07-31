from sqlalchemy import Column, BigInteger, Integer, Date, ForeignKey, Text
from app import db 
class Reorder(db.Model):
    __tablename__ = "reorder"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reorder_date = Column(Date, nullable=False)
    store_id = Column(BigInteger, ForeignKey("store_data.store_id", ondelete="CASCADE"), nullable=False)
    sku = Column(Text, ForeignKey("inventory.sku", ondelete="CASCADE"), nullable=False)
    qty = Column(Integer, nullable=False)
    lead_time_days = Column(Integer, nullable=False)

    def __repr__(self):
        return f"<Reorder id={self.id} store_id={self.store_id} sku={self.sku} qty={self.qty}>"
