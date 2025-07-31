from sqlalchemy import Column, Integer, String, Float
from sqlalchemy import UniqueConstraint
from app import db
import uuid

class warehouse_Max_Data(db.Model):
    __tablename__ = "warehouse_max_data"

    store_id = db.Column(db.Integer, db.ForeignKey("store_data.store_id"), primary_key=True)
    warehouse_name = db.Column(db.String, nullable=False)
    max_capacity = db.Column(db.Integer, nullable=False)
    
    __table_args__ = (
    UniqueConstraint("warehouse_name", name="uniq_warehouse_name"),
)
