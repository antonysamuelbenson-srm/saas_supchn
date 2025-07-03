# init_db.py
from app import create_app, db
from app.models import user, alert, dashboard
from app.models.node import Node
from app.models.dashboard import DashboardMetrics
from app.models.alert import Alert
from app.models.node import Node
from datetime import datetime
import uuid

app = create_app()

with app.app_context():
    db.session.add(DashboardMetrics(current_demand=1200, inventory_position=850, weeks_of_supply=4.3))

    db.session.add(Alert(
        id=str(uuid.uuid4()),
        type="Stockout",
        severity="High",
        message="SKU 2345 out of stock in Store A",
        created_at=datetime.utcnow()
    ))

    db.session.add(Node(
        id=str(uuid.uuid4()),
        name="Warehouse A",
        type="Warehouse"
    ))

    db.session.commit()
    print("✅ Dummy data inserted")
