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
    # Fetch weekly forecast to get eligible SKUs
    forecast_rows = db.session.query(
        ForecastDaily.forecast_date,
        ForecastDaily.store_id,
        ForecastDaily.sku,
        ForecastDaily.forecast_qty
    ).filter(ForecastDaily.forecast_date != None).all()

    # Map of week -> set of eligible SKUs
    weekly_eligible = defaultdict(set)
    weekly_forecast_qty = defaultdict(lambda: defaultdict(int))
    for row in forecast_rows:
        week = get_week_start(row.forecast_date)
        key = (row.store_id, row.sku)
        weekly_eligible[week].add(key)
        weekly_forecast_qty[week][key] += row.forecast_qty

    # Fetch inventory
    inventory_rows = db.session.query(
        InventorySnapshot.snapshot_date,
        InventorySnapshot.store_id,
        InventorySnapshot.sku,
        InventorySnapshot.qty
    ).filter(InventorySnapshot.snapshot_date != None).all()

    # Get the most recent inventory snapshot per week
    inventory_by_week = defaultdict(lambda: defaultdict(lambda: {'date': None, 'qty': 0}))
    for row in inventory_rows:
        week = get_week_start(row.snapshot_date)
        key = (row.store_id, row.sku)
        
        # Keep only the most recent snapshot for each week
        if (inventory_by_week[week][key]['date'] is None or 
            row.snapshot_date > inventory_by_week[week][key]['date']):
            inventory_by_week[week][key] = {
                'date': row.snapshot_date, 
                'qty': row.qty
            }

    inserted = 0

    # Process each week
    for week, sku_set in weekly_eligible.items():
        if week > date.today():
            continue

        # Skip if already computed
        exists = db.session.query(func.count()).select_from(AvailabilityRate).filter_by(week_start=week).scalar()
        if exists:
            continue

        eligible_count = len(sku_set)
        if eligible_count == 0:
            continue

        oos_count = 0
        
        # Check each eligible SKU for this week
        for key in sku_set:
            total_inventory = inventory_by_week.get(week, {}).get(key, {'qty': 0})['qty']
            total_forecast = weekly_forecast_qty[week].get(key, 0)
            if total_inventory < total_forecast:  # This covers both zero and insufficient
                oos_count += 1

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
