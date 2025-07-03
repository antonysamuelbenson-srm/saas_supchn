from app import db
import uuid

class Node(db.Model):
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100))
    type = db.Column(db.String(50))  # Store / Warehouse
