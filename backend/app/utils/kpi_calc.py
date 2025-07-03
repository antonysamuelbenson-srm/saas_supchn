# app/utils/kpi_calc.py

from app import db
from app.models.inventory import InventorySnapshot
from app.models.reorder_config import ReorderConfig
from app.models.dashboard import DashboardMetrics
from app.models.alert import Alert
from datetime import datetime, timedelta
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
                store_code=item.store_code,
                message=f"Stockout: {item.sku} in {item.store_code}",
                type="Stockout",
                severity="Medium",
                created_at=datetime.utcnow()
            ))
        elif item.sku in reorder_map and item.quantity < reorder_map[item.sku]:
            alerts.append(Alert(
                id=str(uuid.uuid4()),
                role_user_id=role_user_id,
                sku=item.sku,
                store_code=item.store_code,
                message=f"Below threshold: {item.sku} in {item.store_code}",
                type="BelowThreshold",
                severity="Medium",
                created_at=datetime.utcnow()
            ))

    db.session.add_all(alerts)
    db.session.commit()
    return len(alerts)

def time_ago(dt):
    now = datetime.utcnow()
    diff = now - dt

    if diff < timedelta(seconds=60):
        return "just now"
    elif diff < timedelta(hours=1):
        minutes = diff.seconds // 60
        return f"{minutes} minute(s) ago"
    elif diff < timedelta(days=1):
        hours = diff.seconds // 3600
        return f"{hours} hour(s) ago"
    else:
        days = diff.days
        return f"{days} day(s) ago"

def calculate_kpis(role_user_id):
    inventory = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()
    reorder_map = {
        r.sku: r for r in ReorderConfig.query.filter_by(role_user_id=role_user_id).all()
    }

    total_units = 0
    stockouts = 0
    below_rop_count = 0
    unique_skus = set()
    store_wise = {}

    for item in inventory:
        total_units += item.quantity
        unique_skus.add(item.sku)
        if item.quantity == 0:
            stockouts += 1
        if item.sku in reorder_map and item.quantity < reorder_map[item.sku].reorder_point:
            below_rop_count += 1
        store_wise[item.store_code] = store_wise.get(item.store_code, 0) + item.quantity

    percent_below_rop = round((below_rop_count / len(unique_skus)) * 100, 2) if unique_skus else 0
    current_demand = sum(r.avg_daily_usage * 30 for r in reorder_map.values() if r.avg_daily_usage>0)

    now = datetime.utcnow()
    
    metrics = DashboardMetrics(
        id=str(uuid.uuid4()),
        role_user_id=role_user_id,
        current_demand=current_demand,
        inventory_position=total_units,
        weeks_of_supply=round(total_units / (current_demand / 30), 2) if current_demand else 0
    )

    db.session.add(metrics)
    db.session.commit()

    return {
        "current_demand": current_demand,
        "inventory_position": metrics.inventory_position,
        "weeks_of_supply": metrics.weeks_of_supply,
        "stockouts": stockouts,
        "percent_below_rop": percent_below_rop,
        "store_wise_stock": store_wise,
        "last_updated": time_ago(now)
    }

