# app/utils/kpi_calc.py

from app import db
from app.models.inventory import InventorySnapshot
from app.models.reorder_config import ReorderConfig
from app.models.alert import Alert
from datetime import datetime
import uuid

def generate_alerts(role_user_id):
    alerts = []

    # ✅ Get only inventory entries for this user
    inventory = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()

    # ✅ Get reorder configs for this user
    reorder_map = {
        r.sku: r.reorder_point
        for r in ReorderConfig.query.filter_by(role_user_id=role_user_id).all()
    }

    for item in inventory:
        if item.quantity == 0:
            alerts.append(Alert(
                id=str(uuid.uuid4()),
                role_user_id=role_user_id,
                sku=item.sku,
                store_id=item.store_id,
                message=f"Stockout: {item.sku} in {item.store_id}",
                type="Stockout",
                severity="Medium",
                created_at=datetime.utcnow()
            ))
        elif item.sku in reorder_map and item.quantity < reorder_map[item.sku]:
            alerts.append(Alert(
                id=str(uuid.uuid4()),
                role_user_id=role_user_id,
                sku=item.sku,
                store_id=item.store_id,
                message=f"Below threshold: {item.sku} in {item.store_id}",
                type="BelowThreshold",
                severity="Medium",
                created_at=datetime.utcnow()
            ))

    db.session.add_all(alerts)
    db.session.commit()
    return len(alerts)
