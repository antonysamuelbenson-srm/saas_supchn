from flask import Blueprint, request, jsonify
import polars as pl
from datetime import timedelta, date, datetime
from sqlalchemy import func
import uuid
import pickle
from app import db
from supabase import create_client
from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required
from app.utils.forecast_utils import (
    run_forecast_logic, calculate_metrics, prepare_chart_data, aggregate_weekly
)
from app.services.forecast_service import execute_forecast_job
from app.models.forecast_schedule import ForecastSchedule
from app.models.forecast_log import ForecastLog 
from app.models.predict import ForecastDaily
from app.models.sales import Sales
from collections import defaultdict
import os
from dotenv import load_dotenv
from app.utils.decorators import role_required

bp = Blueprint("forecast", __name__)


# Supabase client
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["ANON_KEY"])

@bp.route("/forecast/store/<int:store_id>", methods=["GET"])
@role_required
def forecast_for_store(store_id):
    """
    Returns forecast data for a specific store — grouped by SKU & date.
    Accepts optional query param: days=7 (lookahead days)
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # STEP 1: Check query param or fallback to stored setting
    days_param = request.args.get("days")
    if days_param is not None:
        try:
            days = int(days_param)
        except ValueError:
            return jsonify({"error": "Invalid 'days' parameter"}), 400
    else:
        # Get stored lookahead_days from Supabase user profile
        user_profile = (
            supabase.table("user")
            .select("lookahead_days")
            .eq("role_user_id", role_user_id)
            .maybe_single()
            .execute()
        ).data
        days = int(user_profile.get("lookahead_days", 7))  # default to 7 if not found

    # STEP 2: Check if store belongs to this user
    store_check = (
        supabase.table("store_data")
        .select("store_id")
        .eq("store_id", store_id)
        .maybe_single()
        .execute()
    ).data

    if not store_check:
        return jsonify({"error": "Store not found"}), 404

    # STEP 3: Get forecast within range
    today = date.today()
    end_date = today + timedelta(days=days)

    forecast_rows = (
        supabase.table("forecast_daily")
        .select("forecast_date,sku,forecast_qty")
        .eq("store_id", store_id)
        .gte("forecast_date", today.isoformat())
        .lte("forecast_date", end_date.isoformat())
        .order("forecast_date")
        .execute()
    ).data or []

    forecast_data = defaultdict(list)
    for row in forecast_rows:
        forecast_data[row["sku"]].append({
            "date": row["forecast_date"],
            "forecast_qty": float(row["forecast_qty"])
        })

    return jsonify({
        "store_id": store_id,
        "forecast": forecast_data
    }), 200

@bp.route("/user/lookahead_days", methods=["POST", "OPTIONS"])
@role_required
def update_lookahead_days():
    if request.method == "OPTIONS":
        # Preflight for CORS
        response = jsonify({})
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response, 200

    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    lookahead_days = data.get("lookahead_days")

    if not isinstance(lookahead_days, int) or lookahead_days <= 0:
        return jsonify({"error": "Invalid days value"}), 400

    try:
        supabase.table("user").update({
            "lookahead_days": lookahead_days
        }).eq("role_user_id", role_user_id).execute()
        return jsonify({"message": "Lookahead days updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/user/lookahead_days", methods=["GET"])
@role_required
def get_lookahead_days():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user_row = (supabase.table("user")
                        .select("lookahead_days")
                        .eq("role_user_id", role_user_id)
                        .single()
                        .execute()).data

    return jsonify({
        "lookahead_days": user_row.get("lookahead_days", 7)
    }), 200


@bp.route("/forecast/schedule/horizon", methods=["POST"])
@role_required
def update_schedule_horizon():
    try:
        data = request.json
        schedule_id = data.get("schedule_id")  # allow targeting a specific schedule
        n_weeks = int(data.get("n_weeks", 7))

        if schedule_id:
            schedule = ForecastSchedule.query.get(schedule_id)
            if not schedule:
                return jsonify({"error": "Schedule not found"}), 404
            schedule.n_weeks = n_weeks
        else:
            # Update all schedules if no ID is given
            ForecastSchedule.query.update({"n_weeks": n_weeks})

        db.session.commit()
        return jsonify({"message": f"Forecast horizon set to {n_weeks} days"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@bp.route("/forecast/schedule", methods=["POST"])
@role_required
def set_forecast_schedule():
    try:
        data = request.json

        # Fetch default n_weeks from DB (e.g., from a system settings table or default schedule)
        default_horizon_record = ForecastSchedule.query.order_by(ForecastSchedule.created_at.desc()).first()
        default_n_weeks = default_horizon_record.n_weeks if default_horizon_record else 7

        schedule = ForecastSchedule(
            id=str(uuid.uuid4()),
            store_id=data.get("store_id"),            # optional
            product_id=data.get("product_id"),        # optional
            frequency=data["frequency"],              # required
            time_of_day=data.get("time_of_day", "00:00"),
            day_of_week=data.get("day_of_week", "Saturday"),
            n_weeks=default_n_weeks                      # fetched from DB
        )

        db.session.add(schedule)
        db.session.commit()
        return jsonify({"message": "Schedule added successfully", "n_weeks": default_n_weeks}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# 🚩 View Forecast Schedules
@bp.route("/forecast/schedule", methods=["GET"])
@role_required
def view_forecast_schedule():
    try:
        schedules = ForecastSchedule.query.all()
        data = [{
            "id": s.id,
            "store_id": s.store_id,
            "product_id": s.product_id,
            "frequency": s.frequency,
            "time_of_day": s.time_of_day,
            "day_of_week": s.day_of_week,
            "n_weeks" : s.n_weeks
        } for s in schedules]
        return jsonify({"schedules": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# @bp.route("/forecast/run", methods=["POST"])
# def run_forecast():
#     try:
#         # 1️⃣ Get latest schedule
#         latest_sched = ForecastSchedule.query.order_by(ForecastSchedule.created_at.desc()).first()
#         if not latest_sched:
#             return jsonify({"status": "error", "message": "No forecast schedule found"}), 404

#         # Ensure n_weeks is native Python int
#         n_weeks = int(latest_sched.n_weeks)
#         if hasattr(latest_sched.n_weeks, 'item'):  # numpy/pandas scalar
#             n_weeks = int(latest_sched.n_weeks.item())
#         elif hasattr(latest_sched.n_weeks, 'to_python'):  # Polars
#             n_weeks = int(latest_sched.n_weeks.to_python())
#         else:
#             n_weeks = int(latest_sched.n_weeks)
            
#         results_summary = []
#         all_forecast_rows = []

#         print(f"DEBUG: n_weeks type: {type(n_weeks)}, value: {n_weeks}")
#         print(f"DEBUG: n_weeks is native Python int? {type(n_weeks) == int}")
#         print(f"DEBUG: latest_sched.id type: {type(latest_sched.id)}")
#         print(f"DEBUG: latest_sched.store_id type: {type(latest_sched.store_id)}")
#         print(f"DEBUG: latest_sched.product_id type: {type(latest_sched.product_id)}")

#         # 2️⃣ Create ForecastLog entry
#         print(f"DEBUG: About to create ForecastLog with:")
#         print(f"  store_id: {latest_sched.store_id} (type: {type(latest_sched.store_id)})")
#         print(f"  product_id: {latest_sched.product_id} (type: {type(latest_sched.product_id)})")
#         print(f"  n_weeks: {n_weeks} (type: {type(n_weeks)})")
#         print(f"  schedule_id: {latest_sched.id} (type: {type(latest_sched.id)})")
        
#         forecast_log = ForecastLog(
#             id=uuid.uuid4(),
#             run_time=datetime.utcnow(),
#             store_id=latest_sched.store_id,
#             product_id=latest_sched.product_id,
#             n_weeks=n_weeks,
#             schedule_id=latest_sched.id,
#             run_started_at=datetime.utcnow(),
#             status="running"
#         )
        
#         print("DEBUG: ForecastLog created successfully")
        
#         try:
#             db.session.add(forecast_log)
#             print("DEBUG: ForecastLog added to session")
#             db.session.flush()  # generate log_id without committing
#             print("DEBUG: ForecastLog flushed successfully")
#         except Exception as e:
#             print(f"ERROR: Failed during ForecastLog creation/flush: {e}")
#             raise
            
#         log_id = forecast_log.id
#         log_id_to_use = log_id

#         print(f"DEBUG: log_id type: {type(log_id)}")

#         # 3️⃣ Determine store-product combos
#         if latest_sched.store_id and latest_sched.product_id:
#             combos = [(latest_sched.store_id, latest_sched.product_id)]
#         else:
#             print("DEBUG: Fetching all store-product combos from Sales table...")
#             combos = db.session.query(Sales.store_id, Sales.product_id).distinct().all()
#             combos = [(c[0], c[1]) for c in combos]
#             print(f"DEBUG: Found {len(combos)} combos from Sales table")
#             if combos:
#                 print(f"DEBUG: First combo types: store_id={type(combos[0][0])}, product_id={type(combos[0][1])}")

#         print(f"DEBUG: combos: {combos}")

#         # 4️⃣ Run forecasts for each combo
#         for store_id, product_id in combos:
#             print(f"DEBUG: Processing combo - store_id: {store_id} (type: {type(store_id)}), product_id: {product_id} (type: {type(product_id)})")
            
#             # Ensure store_id and product_id are strings AND check for problematic types
#             if hasattr(store_id, 'item'):  # numpy/pandas scalar
#                 store_id = str(store_id.item())
#             elif hasattr(store_id, 'to_python'):  # Polars
#                 store_id = str(store_id.to_python())
#             else:
#                 store_id = str(store_id)
                
#             if hasattr(product_id, 'item'):  # numpy/pandas scalar
#                 product_id = str(product_id.item())
#             elif hasattr(product_id, 'to_python'):  # Polars
#                 product_id = str(product_id.to_python())
#             else:
#                 product_id = str(product_id)
            
#             print(f"DEBUG: After conversion - store_id: {store_id} (type: {type(store_id)}), product_id: {product_id} (type: {type(product_id)})")
            
#             forecasts = run_forecast_logic(store_id, product_id, n_weeks)
#             print(f"DEBUG: forecasts returned: {len(forecasts) if forecasts else 0}")

#             if not forecasts:
#                 print(f"⚠ No forecasts generated for store {store_id}, product {product_id}")
#                 continue

#             # DEBUG: Check the first forecast structure
#             if forecasts:
#                 first_forecast = forecasts[0]
#                 print(f"DEBUG: First forecast structure: {first_forecast}")
#                 print(f"DEBUG: First forecast types: {[(k, type(v)) for k, v in first_forecast.items()]}")

#             # Prepare ForecastDaily rows
#             now = datetime.utcnow()
#             for i, f in enumerate(forecasts):
#                 print(f"DEBUG: Processing forecast {i}: {f}")
                
#                 # Check forecast value type
#                 forecast_val = f.get("forecast", 0.0)
#                 pred_val = float(forecast_val) 
#                 print(f"DEBUG: forecast_val before conversion: {forecast_val} (type: {type(forecast_val)})")
                
#                 # Convert to native Python float (handle numpy, pandas, polars types)
#                 if hasattr(forecast_val, 'item'):  # numpy/pandas types
#                     pred_val = float(forecast_val.item())
#                 elif hasattr(forecast_val, 'to_python'):  # Polars types
#                     pred_val = float(forecast_val.to_python())
#                 elif str(type(forecast_val)).startswith('<class \'polars'):  # Polars types
#                     pred_val = float(forecast_val)
#                 else:
#                     pred_val = float(forecast_val)
                    
#                 print(f"DEBUG: pred_val after conversion: {pred_val} (type: {type(pred_val)})")
#                 print(f"DEBUG: pred_val is native Python float? {type(pred_val) == float}")

#                 # Ensure date is native Python date (not datetime) - SIMPLIFIED
#                 forecast_date = f["date"]
#                 print(f"DEBUG: forecast_date before conversion: {forecast_date} (type: {type(forecast_date)})")
                
#                 # Simple conversion - just get the date part
#                 from datetime import date
#                 if hasattr(forecast_date, 'date') and callable(getattr(forecast_date, 'date')):
#                     # It's a datetime object, get the date part
#                     forecast_date = forecast_date.date()
#                 elif isinstance(forecast_date, date):
#                     # Already a date object, keep as is
#                     pass
#                 else:
#                     # Convert string or other format to date
#                     import datetime as dt
#                     if isinstance(forecast_date, str):
#                         forecast_date = dt.datetime.strptime(forecast_date[:10], '%Y-%m-%d').date()
#                     else:
#                         # Last resort - convert to string then parse
#                         date_str = str(forecast_date)[:10]
#                         forecast_date = dt.datetime.strptime(date_str, '%Y-%m-%d').date()
                    
#                 print(f"DEBUG: forecast_date after conversion: {forecast_date} (type: {type(forecast_date)})")
#                 print(f"DEBUG: Is forecast_date a date? {isinstance(forecast_date, date)}")
#                 print(f"DEBUG: Is forecast_date a datetime? {isinstance(forecast_date, datetime)}")

#                 # Ensure all values are native Python types
#                 row_data = {
#                     'store_id': str(store_id),  # Ensure string
#                     'product_id': str(product_id),  # Ensure string
#                     'date': forecast_date,  # Native date
#                     'ForecastDailyed': pred_val,  # Native float
#                     'created_at': now,  # Native datetime
#                     'forecast_log_id': log_id_to_use  # UUID
#                 }
#                 print(f"DEBUG: Row data types: {[(k, type(v)) for k, v in row_data.items()]}")

#                 all_forecast_rows.append(
#                     ForecastDaily(**row_data)
#                 )

#             results_summary.append({
#                 "store_id": store_id,
#                 "product_id": product_id,
#                 "n_weeks": n_weeks,
#                 "forecast_count": len(forecasts)
#             })

#         print(f"DEBUG: Total rows to insert: {len(all_forecast_rows)}")
        
#         # DEBUG: Check the first row's data types before insert
#         if all_forecast_rows:
#             first_row = all_forecast_rows[0]
#             print(f"DEBUG: First row attributes:")
#             for attr in ['store_id', 'product_id', 'date', 'ForecastDailyed', 'created_at', 'forecast_log_id']:
#                 if hasattr(first_row, attr):
#                     val = getattr(first_row, attr)
#                     print(f"  {attr}: {val} (type: {type(val)})")

#         # 5️⃣ Insert forecasts
#         if all_forecast_rows:
#             print("DEBUG: About to insert forecast rows...")
#             try:
#                 db.session.add_all(all_forecast_rows)
#                 print("DEBUG: add_all completed successfully")
#             except Exception as e:
#                 print(f"DEBUG: Error during add_all: {e}")
#                 raise

#         # 6️⃣ Mark ForecastLog as completed
#         forecast_log.status = "completed"
#         forecast_log.run_completed_at = datetime.utcnow()

#         # 7️⃣ Commit all changes
#         print("DEBUG: About to commit...")
#         db.session.commit()
#         print("DEBUG: Commit successful!")

#         return jsonify({
#             "status": "success",
#             "n_weeks": n_weeks,
#             "total_combinations": len(results_summary),
#             "details": results_summary
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         print(f"ERROR: {str(e)}")
#         print(f"ERROR TYPE: {type(e)}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/forecast/run", methods=["POST"])
def run_forecast_endpoint():
    data = request.get_json(silent=True) or {}
    schedule_id = data.get("schedule_id")
    result = execute_forecast_job(schedule_id)
    return jsonify(result), 200

    
@bp.route("/forecast/store-level", methods=["GET"])
@role_required
def store_level_forecast():
    try:
        # 1️⃣ Get latest schedule horizon
        latest_sched = ForecastSchedule.query.order_by(ForecastSchedule.created_at.desc()).first()
        if not latest_sched:
            return jsonify({"error": "No forecast schedule found"}), 404

        n_weeks = int(latest_sched.n_weeks)
        days = n_weeks * 7

        # 2️⃣ Define start and cutoff dates
        start_date = datetime.utcnow().date()
        cutoff_date = start_date + timedelta(days=days)

        # 3️⃣ Aggregate weekly forecasts from now → cutoff
        forecast_rows = (
            db.session.query(
                ForecastDaily.store_id,
                func.date_trunc('week', ForecastDaily.date).label("week_start"),
                func.sum(ForecastDaily.predicted).label("forecast")
            )
            .filter(ForecastDaily.date >= start_date)
            .filter(ForecastDaily.date <= cutoff_date)
            .group_by(
                ForecastDaily.store_id,
                func.date_trunc('week', ForecastDaily.date)
            )
            .order_by(ForecastDaily.store_id, "week_start")
            .all()
        )

        # 4️⃣ Convert query results to JSON-friendly format
        results = {}
        for store_id, week_start, forecast in forecast_rows:
            week_start_str = week_start.strftime("%Y-%m-%d")
            results.setdefault(store_id, []).append({
                "week_start": week_start_str,
                "forecast": float(forecast)
            })

        # 5️⃣ Final list format
        response_data = [
            {"store_id": store_id, "forecast_weekly": weeks}
            for store_id, weeks in results.items()
        ]

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@bp.route("/forecast/sku-level", methods=["GET"])
@role_required
def sku_level_forecast():
    try:
        # 1️⃣ Get latest schedule horizon
        latest_sched = ForecastSchedule.query.order_by(ForecastSchedule.created_at.desc()).first()
        if not latest_sched:
            return jsonify({"error": "No forecast schedule found"}), 404

        n_weeks = int(latest_sched.n_weeks)
        days = n_weeks * 7

        # 2️⃣ Define start and cutoff dates
        start_date = datetime.utcnow().date()
        cutoff_date = start_date + timedelta(days=days)

        # 3️⃣ Aggregate weekly forecasts per SKU (across all stores)
        forecast_rows = (
            db.session.query(
                ForecastDaily.product_id,
                func.date_trunc('week', ForecastDaily.date).label("week_start"),
                func.sum(ForecastDaily.predicted).label("forecast")
            )
            .filter(ForecastDaily.date >= start_date)
            .filter(ForecastDaily.date <= cutoff_date)
            .group_by(
                ForecastDaily.product_id,
                func.date_trunc('week', ForecastDaily.date)
            )
            .order_by(ForecastDaily.product_id, "week_start")
            .all()
        )

        # 4️⃣ Convert query results to JSON-friendly format
        results = {}
        for product_id, week_start, forecast in forecast_rows:
            week_start_str = week_start.strftime("%Y-%m-%d")
            results.setdefault(product_id, []).append({
                "week_start": week_start_str,
                "forecast": float(forecast)
            })

        # 5️⃣ Final list format
        response_data = [
            {"product_id": product_id, "forecast_weekly": weeks}
            for product_id, weeks in results.items()
        ]

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/forecast/accuracy/store", methods=["GET"])
@role_required
def store_level_accuracy():
    try:
        # Past 4 weeks date range
        start_date = datetime.utcnow().date() - timedelta(weeks=4)
        end_date = datetime.utcnow().date()

        rows = (
            db.session.query(
                ForecastDaily.store_id,
                func.date_trunc('week', ForecastDaily.date).label("week_start"),
                (func.sum(func.abs(ForecastDaily.actual - ForecastDaily.predicted)) /
                 func.nullif(func.sum(ForecastDaily.actual), 0) * 100).label("mape")
            )
            .filter(ForecastDaily.date >= start_date, ForecastDaily.date <= end_date)
            .group_by(
                ForecastDaily.store_id,
                func.date_trunc('week', ForecastDaily.date)
            )
            .order_by(ForecastDaily.store_id, "week_start")
            .all()
        )

        results = {}
        for store_id, week_start, mape in rows:
            results.setdefault(store_id, []).append({
                "week_start": week_start.strftime("%Y-%m-%d"),
                "mape": round(float(mape), 2) if mape is not None else None
            })

        return jsonify([
            {"store_id": store_id, "weekly_accuracy": weeks}
            for store_id, weeks in results.items()
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route("/forecast/accuracy/sku", methods=["GET"])
@role_required
def sku_level_accuracy():
    try:
        # Past 4 weeks date range
        start_date = datetime.utcnow().date() - timedelta(weeks=4)
        end_date = datetime.utcnow().date()

        rows = (
            db.session.query(
                ForecastDaily.product_id,
                func.date_trunc('week', ForecastDaily.date).label("week_start"),
                (func.sum(func.abs(ForecastDaily.actual - ForecastDaily.predicted)) /
                 func.nullif(func.sum(ForecastDaily.actual), 0) * 100).label("mape")
            )
            .filter(ForecastDaily.date >= start_date, ForecastDaily.date <= end_date)
            .group_by(
                ForecastDaily.product_id,
                func.date_trunc('week', ForecastDaily.date)
            )
            .order_by(ForecastDaily.product_id, "week_start")
            .all()
        )

        results = {}
        for product_id, week_start, mape in rows:
            results.setdefault(product_id, []).append({
                "week_start": week_start.strftime("%Y-%m-%d"),
                "mape": round(float(mape), 2) if mape is not None else None
            })

        return jsonify([
            {"product_id": product_id, "weekly_accuracy": weeks}
            for product_id, weeks in results.items()
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@bp.route("/forecast/chart-data", methods=["GET"])
@role_required
def chart_data():
    try:
        # Past 4 weeks date range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(weeks=4)

        # Aggregate by store-week
        rows = (
            db.session.query(
                ForecastDaily.store_id,
                func.date_trunc('week', ForecastDaily.date).label("week_start"),
                func.sum(ForecastDaily.predicted).label("forecast"),
                func.sum(ForecastDaily.actual).label("actual")
            )
            .filter(ForecastDaily.date >= start_date)
            .filter(ForecastDaily.date <= end_date)
            .group_by(ForecastDaily.store_id, func.date_trunc('week', ForecastDaily.date))
            .order_by(ForecastDaily.store_id, "week_start")
            .all()
        )

        # Group into JSON
        results = {}
        for store_id, week_start, forecast, actual in rows:
            week_str = week_start.strftime("%Y-%m-%d")
            results.setdefault(store_id, []).append({
                "week_start": week_str,
                "forecast": float(forecast),
                "actual": float(actual)
            })

        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🚩 Forecast Run Logs
@bp.route("/forecast/logs", methods=["GET"])
@role_required
def forecast_logs():
    try:
        logs = ForecastLog.query.order_by(ForecastLog.run_time.desc()).all()
        data = [{
            "run_time": log.run_time.strftime("%Y-%m-%d %H:%M:%S"),
            "store_id": log.store_id,
            "product_id": log.product_id,
            "n_weeks": log.n_weeks
        } for log in logs]
        return jsonify({"logs": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
