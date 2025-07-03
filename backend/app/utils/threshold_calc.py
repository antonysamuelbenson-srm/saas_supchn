from app import db
from app.models.reorder_config import ReorderConfig
from app.models.inventory import InventorySnapshot
from datetime import datetime
import uuid

def update_reorder_config(role_user_id):
    inventory = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()
    sku_usage = {}

    for item in inventory:
        sku_usage[item.sku] = sku_usage.get(item.sku, 0) + item.quantity

    updated = 0
    for sku, total_qty in sku_usage.items():
        avg_daily = total_qty / 30
        safety_stock = 0.5 * avg_daily
        lead_time = 7
        reorder_point = (avg_daily * lead_time) + safety_stock

        config = ReorderConfig.query.filter_by(sku=sku, role_user_id=role_user_id).first()
        if config:
            config.avg_daily_usage = avg_daily
            config.lead_time_days = lead_time
            config.safety_stock = safety_stock
            config.reorder_point = reorder_point
        else:
            config = ReorderConfig(
                id=str(uuid.uuid4()),
                sku=sku,
                avg_daily_usage=avg_daily,
                lead_time_days=lead_time,
                safety_stock=safety_stock,
                reorder_point=reorder_point,
                role_user_id=role_user_id  # ✅ Add this
            )
            db.session.add(config)
        updated += 1

    db.session.commit()
    return updated

