from app import db
from app.models.reorder_config import ReorderConfig
from app.models.inventory import InventorySnapshot
from datetime import datetime
import uuid

def update_reorder_config(role_user_id, formula="default"):
    inventory = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()
    sku_usage = {}
    processed_skus = set()

    for item in inventory:
        sku_clean = item.sku.strip().upper()
        sku_usage[sku_clean] = sku_usage.get(sku_clean, 0) + item.quantity

    updated = 0
    for sku, total_qty in sku_usage.items():
        avg_daily = total_qty / 30
        safety_stock = 0.5 * avg_daily
        lead_time = 7

        if formula == "default":
            reorder_point = (avg_daily * lead_time) + safety_stock
        elif formula == "aggressive":
            reorder_point = (avg_daily * lead_time)
        elif formula == "conservative":
            reorder_point = (avg_daily * lead_time) + 2 * safety_stock
        else:
            reorder_point = (avg_daily * lead_time) + safety_stock  # fallback

        # config = ReorderConfig.query.filter_by(sku=sku, role_user_id=role_user_id).first()
        # if config:
        #     config.avg_daily_usage = avg_daily
        #     config.lead_time_days = lead_time
        #     config.safety_stock = safety_stock
        #     config.reorder_point = reorder_point
        # else:
        #     config = ReorderConfig(
        #         id=str(uuid.uuid4()),
        #         sku=sku,
        #         avg_daily_usage=avg_daily,
        #         lead_time_days=lead_time,
        #         safety_stock=safety_stock,
        #         reorder_point=reorder_point,
        #         role_user_id=role_user_id
        #     )
        #     db.session.add(config)

        # updated += 1
        existing = ReorderConfig.query.filter_by(sku=sku_clean, role_user_id=role_user_id).first()

        if existing:
            print(f"Updating reorder config for SKU {sku}")
            existing.avg_daily_usage = avg_daily
            existing.lead_time_days = lead_time
            existing.safety_stock = safety_stock
            existing.reorder_point = reorder_point
        else:
            print(f"Inserting new reorder config for SKU {sku}")
            new_config = ReorderConfig(
                id=str(uuid.uuid4()),
                sku=sku,
                avg_daily_usage=avg_daily,
                lead_time_days=lead_time,
                safety_stock=safety_stock,
                reorder_point=reorder_point,
                role_user_id=role_user_id
            )
            try:
                db.session.add(new_config)
                db.session.flush()
            except Exception as e:
                db.session.rollback()
                print(f"❌ Failed to insert config for {sku}: {e}")
                continue  # Skip this SKU

        updated += 1
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Failed to commit: {e}")
        return -1
    return updated


