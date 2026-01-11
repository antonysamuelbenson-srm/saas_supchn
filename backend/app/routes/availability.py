from flask import Blueprint, jsonify
from sqlalchemy import func
import logging
from datetime import timedelta, date
from collections import defaultdict
from sqlalchemy import text

from app import db
from app.models.forecast import ForecastDaily
from app.models.availability import AvailabilityRate
from app.models.inventory import InventorySnapshot
from app.models.store import Store
from app.utils.decorators import role_required
logger = logging.getLogger(__name__)

bp = Blueprint("availability_rate", __name__)

    
def get_week_start(date):
    return date - timedelta(days=date.weekday())

@bp.route("/availability/recompute", methods=["POST"])
@role_required
def recompute_availability_rate():
    # Step 1: Fetch forecasted demand (eligible SKUs)
    forecast_rows = db.session.query(
        ForecastDaily.forecast_date,
        ForecastDaily.store_id,
        ForecastDaily.sku,
        ForecastDaily.forecast_qty
    ).filter(ForecastDaily.forecast_date.isnot(None)).all()

    # {week_start: {(store_id, sku): [daily_forecast_qtys]}}
    weekly_demand = defaultdict(lambda: defaultdict(list))
    for row in forecast_rows:
        week = get_week_start(row.forecast_date)
        weekly_demand[week][(row.store_id, row.sku)].append(row.forecast_qty or 0)

    # Step 2: Fetch inventory data
    inventory_rows = db.session.query(
        InventorySnapshot.snapshot_date,
        InventorySnapshot.store_id,
        InventorySnapshot.sku,
        InventorySnapshot.qty
    ).filter(InventorySnapshot.snapshot_date.isnot(None)).all()

    # {week_start: {(store_id, sku): [daily_qtys]}}
    weekly_inventory = defaultdict(lambda: defaultdict(list))
    for row in inventory_rows:
        week = get_week_start(row.snapshot_date)
        weekly_inventory[week][(row.store_id, row.sku)].append(row.qty or 0)

    inserted = 0

    for week, sku_demands in weekly_demand.items():
        if week > date.today():
            continue

        # Check if already computed
        exists = db.session.query(func.count()).select_from(AvailabilityRate).filter_by(week_start=week).scalar()
        if exists:
            continue

        eligible_count = len(sku_demands)
        oos_count = 0

        for key, demand_list in sku_demands.items():
            daily_demand = demand_list
            daily_inventory = weekly_inventory.get(week, {}).get(key, [])

            # If no inventory recorded at all, consider it OOS
            if not daily_inventory:
                oos_count += 1
                continue

            # Pad inventory list to match demand days if needed
            if len(daily_inventory) < len(daily_demand):
                daily_inventory += [0] * (len(daily_demand) - len(daily_inventory))

            # OOS if ANY day inventory < demand
            insufficient = any(inv < dem for inv, dem in zip(daily_inventory, daily_demand))
            if insufficient:
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
    try:
        # --- MODIFICATION: Use the raw SQL query ---
        # This query performs the "bridge join" and all aggregations
        # in the database, which is fast and correct.
        sql_query = """
        WITH
        DailyComparison AS (
            SELECT
                DATE_TRUNC('week', p.date) AS week_start,
                p.store_id AS store_string_id, 
                p.product_id AS sku,
                CASE
                    WHEN i.qty IS NULL THEN 1
                    WHEN CAST(i.qty AS Float) < p.predicted THEN 1
                    ELSE 0
                END AS is_oos_day
            FROM predict p
            LEFT JOIN store_data s
                ON p.store_id = s.store_code 
            LEFT JOIN inventory i
                ON s.store_id = i.store_id      
                AND p.date = i.snapshot_date    
                AND p.product_id = i.sku        
            WHERE
                p.date <= CURRENT_DATE
        ),
        WeeklySkuStatus AS (
            SELECT
                week_start,
                store_string_id,
                sku,
                MAX(is_oos_day) AS is_oos_week
            FROM DailyComparison
            GROUP BY
                week_start,
                store_string_id,
                sku
        )
        SELECT
            week_start,
            COUNT(*) AS eligible_count,
            SUM(is_oos_week) AS oos_count
        FROM WeeklySkuStatus
        GROUP BY
            week_start
        ORDER BY
            week_start;
        """

        # Step 2: Execute the query and build results
        result = db.session.execute(text(sql_query))
        
        live_results = []
        for row in result:
            eligible_count = row.eligible_count
            # oos_count will be None if SUM() returns null, default to 0
            oos_count = int(row.oos_count or 0) 
            
            # Calculate the rate based on the query's results
            if eligible_count > 0:
                availability_rate = 1 - (oos_count / eligible_count)
            else:
                availability_rate = 0.0

            live_results.append({
                "week_start": row.week_start.strftime("%Y-%m-%d"),
                "availability_rate": round(availability_rate * 100, 2),
                "oos_count": oos_count,
                "eligible_count": int(eligible_count)
            })

        # Step 3: Return the final JSON response
        if not live_results:
            return jsonify({"status": "error", "message": "No availability data found."}), 404

        # The results are already sorted by 'week_start' from the SQL query
        return jsonify({
            "status": "success",
            "data": live_results
        }), 200

    except Exception as e:
        logger.error(f"Failed to calculate live availability: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
    # entries = (
    #     db.session.query(AvailabilityRate)
    #     .order_by(AvailabilityRate.week_start)
    #     .all()
    # )

    # if not entries:
    #     return jsonify({"status": "error", "message": "No availability data found."}), 404

    # return jsonify({
    #     "status": "success",
    #     "data": [
    #         {
    #             "week_start": e.week_start.strftime("%Y-%m-%d"),
    #             "availability_rate": e.availability_rate
    #         } for e in entries
    #     ]
    # }), 200