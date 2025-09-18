from app import db

class RebalanceRecommendation(db.Model):
    __tablename__ = "rebalance_recommendations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_date = db.Column(db.Date, nullable=False)          # date when run executed
    src_store = db.Column(db.String, nullable=False)
    dst_store = db.Column(db.String, nullable=False)
    sku = db.Column(db.String, nullable=False)
    day = db.Column(db.Integer, nullable=False)            # relative day in horizon
    units = db.Column(db.Float, nullable=False)
    objective_value = db.Column(db.Float, nullable=False)  # objective of this run
    status = db.Column(db.String, nullable=False)          # solver status
