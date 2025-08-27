from app import db
from app.models.reorder_config import ReorderConfig
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
import uuid

def update_reorder_config(role_user_id: str, formula: str = "default",store_ids: list[int] | None = None) -> int:
    """
    Recompute and upsert reorder thresholds for every (store_id, SKU)
    found in InventorySnapshot for the given tenant.
    Returns the number of SKUs inserted or updated, or -1 on commit failure.
    """

    r2 = lambda x: round(x, 2)

    q = ForecastDaily.query.filter_by(role_user_id=role_user_id)
    if store_ids is not None:
        q = q.filter(ForecastDaily.store_id.in_(store_ids))

    forecasts = q.all()
    # 1️⃣ aggregate total qty per (store_id, SKU)
    sku_forecasts = {}
    sku_days = {}

    for fc in forecasts:
        if fc.store_id is None or fc.forecast_qty is None:
            continue
        sku = fc.sku.strip().upper()
        key = (int(fc.store_id), sku)

        sku_forecasts[key] = sku_forecasts.get(key, 0.0) + float(fc.forecast_qty)
        sku_days[key] = sku_days.get(key, set())
        sku_days[key].add(fc.forecast_date)

    # 2️⃣ iterate and upsert
    updated = 0
    LEAD_TIME = 7            # days
    for (store_id, sku), total_qty in sku_forecasts.items():
        days_count = len(sku_days[(store_id, sku)])
        if days_count == 0:
            continue
        avg_daily = r2(total_qty / days_count)
        safety_stock = r2(0.5 * avg_daily)

        if formula == "aggressive":
            reorder_point = r2(avg_daily * LEAD_TIME)
        elif formula == "conservative":
            reorder_point = r2(avg_daily * LEAD_TIME + 2 * safety_stock)
        else:  # default
            reorder_point = r2(avg_daily * LEAD_TIME + safety_stock)

        rc = (
            ReorderConfig.query
            .filter_by(role_user_id=role_user_id, store_id=store_id, sku=sku)
            .first()
        )

        if rc:
            rc.avg_daily_usage = avg_daily
            rc.lead_time_days = LEAD_TIME
            rc.safety_stock = safety_stock
            rc.reorder_point = reorder_point
        else:
            db.session.add(
                ReorderConfig(
                    id=str(uuid.uuid4()),
                    role_user_id=role_user_id,
                    store_id=store_id,
                    sku=sku,
                    avg_daily_usage=avg_daily,
                    lead_time_days=LEAD_TIME,
                    safety_stock=safety_stock,
                    reorder_point=reorder_point,
                )
            )

        updated += 1

    # 3️⃣ commit
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"❌ commit failed: {e}")
        return -1

    return updated