from flask import Blueprint, jsonify
from sqlalchemy import func
from datetime import timedelta, date
from collections import defaultdict

from app import db
from app.models.forecast import ForecastDaily
from app.models.availability import AvailabilityRate
from app.models.inventory import InventorySnapshot
from app.utils.decorators import role_required

bp = Blueprint("availability_rate", __name__)

    
def get_week_start(date):
    return date - timedelta(days=date.weekday())


@bp.route("/availability/recompute", methods=["POST"])
@role_required
def recompute_availability_rate():
    forecast_rows = db.session.query(
        ForecastDaily.forecast_date,
        ForecastDaily.store_id,
        ForecastDaily.sku,
    ).filter(ForecastDaily.forecast_date != None).all()

    weekly_eligible = defaultdict(set)
    for row in forecast_rows:
        week = get_week_start(row.forecast_date)
        weekly_eligible[week].add((row.store_id, row.sku))

    inventory_rows = db.session.query(
        InventorySnapshot.snapshot_date,
        InventorySnapshot.store_id,
        InventorySnapshot.sku,
        InventorySnapshot.qty
    ).filter(InventorySnapshot.snapshot_date != None).all()

    inventory_by_week = defaultdict(lambda: defaultdict(list))
    for row in inventory_rows:
        week = get_week_start(row.snapshot_date)
        inventory_by_week[week][(row.store_id, row.sku)].append(row.qty)

    inserted = 0

    for week, sku_set in weekly_eligible.items():
        if week > date.today():
            continue

        # Check if already computed
        exists = db.session.query(func.count()).select_from(AvailabilityRate).filter_by(week_start=week).scalar()
        if exists:
            continue

        eligible_count = len(sku_set)
        oos_count = 0
        for key in sku_set:
            qtys = inventory_by_week.get(week, {}).get(key, [])
            if not qtys or all(q <= 0 for q in qtys):
                oos_count += 1

        if eligible_count == 0:
            continue

        availability_rate = 1 - (oos_count / eligible_count)
        entry = AvailabilityRate(
            week_start=week,
            availability_rate=round(availability_rate * 100, 2)
        )
        db.session.add(entry)
        inserted += 1

    db.session.commit()
    return jsonify({"message": f"Inserted {inserted} availability rate entries"}), 201

@bp.route("/availability", methods=["GET"])
@role_required
def availability_rate_history():
    entries = (
        db.session.query(AvailabilityRate)
        .order_by(AvailabilityRate.week_start)
        .all()
    )

    if not entries:
        return jsonify({"status": "error", "message": "No availability data found."}), 404

    return jsonify({
        "status": "success",
        "data": [
            {
                "week_start": e.week_start.strftime("%Y-%m-%d"),
                "availability_rate": e.availability_rate
            } for e in entries
        ]
    }), 200
