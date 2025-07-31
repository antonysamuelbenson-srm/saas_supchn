from sqlalchemy import Column, Integer, String, Float
from sqlalchemy import UniqueConstraint
from app import db
import uuid

class transferCostDta(db.Model):
    __tablename__ = "transfer_cost_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    start_location = db.Column(db.String, nullable=False)
    end_location = db.Column(db.String, nullable=False)
    transfer_cost = db.Column(db.Float, nullable=False)

    __table_args__ = (
    UniqueConstraint("start_location", "end_location", name="uniq_transfer_cost"),
)
