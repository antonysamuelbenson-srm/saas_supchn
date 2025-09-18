from flask import Blueprint, request, jsonify
import polars as pl
from datetime import timedelta, date, datetime
from sqlalchemy import func,text
import uuid
import pickle
from app import db
from supabase import create_client
from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required
from app.services.forecast_service import run_manual_forecast
from app.models.forecast_schedule import ForecastSchedule
from app.models.forecast_log import ForecastLog 
from app.models.predict import Forecast
from app.models.user import User
from app.models.sales import Sales
from app.models.store import Store
from collections import defaultdict
import os
from dotenv import load_dotenv
import logging
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

@bp.route("/user/lookahead_days", methods=["GET", "POST"])
@role_required
def lookahead_days():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        weeks = body.get("weeks")

        if weeks is None or not isinstance(weeks, int) or weeks < 0:
            return jsonify({"error": "Invalid weeks value"}), 400

        days = weeks * 7

        # Example with SQLAlchemy
        user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.lookahead_days = days
        db.session.commit()

        return jsonify({
            "message": "Lookahead updated",
            "lookahead_days": days
        }), 200

    # GET request
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "lookahead_days": user.lookahead_days or 7
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
    
@bp.post("/run")
def run():
    payload = request.get_json(silent=True) or {}
    weeks = payload.get("weeks")
    if weeks is None:
        return jsonify({"error": "weeks is required"}), 400
    try:
        weeks = int(weeks)
    except Exception:
        return jsonify({"error": "weeks must be an integer"}), 400

    try:
        result = run_manual_forecast(weeks)
        return jsonify({"status": "ok", **result})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    
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
                Forecast.store_id,
                func.date_trunc('week', Forecast.date).label("week_start"),
                func.sum(Forecast.predicted).label("forecast")
            )
            .filter(Forecast.date >= start_date)
            .filter(Forecast.date <= cutoff_date)
            .group_by(
                Forecast.store_id,
                func.date_trunc('week', Forecast.date)
            )
            .order_by(Forecast.store_id, "week_start")
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
                Forecast.product_id,
                func.date_trunc('week', Forecast.date).label("week_start"),
                func.sum(Forecast.predicted).label("forecast")
            )
            .filter(Forecast.date >= start_date)
            .filter(Forecast.date <= cutoff_date)
            .group_by(
                Forecast.product_id,
                func.date_trunc('week', Forecast.date)
            )
            .order_by(Forecast.product_id, "week_start")
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


def get_week_start(date_obj):
    """Return the Monday of the week for given date_obj."""
    return date_obj - timedelta(days=date_obj.weekday())


@bp.get("/forecast/accuracy/store")
@role_required
def compare_all_stores_accuracy():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    lookahead_days = user.lookahead_days or 28
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=lookahead_days)

    daily_data = (
        db.session.query(
            Forecast.store_id,
            Forecast.date,
            Forecast.predicted,
            Forecast.actual,
        )
        .filter(Forecast.date >= start_date, Forecast.date <= end_date)
        .filter(Forecast.actual.isnot(None))
        .filter(Forecast.actual != 0)
        .all()
    )

    print(f"DEBUG: daily_data count = {len(daily_data)}", flush=True)
    weekly_stats = defaultdict(lambda: {"errors": [], "abs_errors": [], "pred_sum": 0, "act_sum": 0, "count": 0})

    for row in daily_data:
        week_start = get_week_start(row.date)
        key = (row.store_id, week_start)

        error = row.predicted - row.actual
        abs_error = abs(error)

        weekly_stats[key]["errors"].append(error)
        weekly_stats[key]["abs_errors"].append(abs_error)
        weekly_stats[key]["pred_sum"] += row.predicted
        weekly_stats[key]["act_sum"] += row.actual
        weekly_stats[key]["count"] += 1

    results = []
    for (store_id, week_start), stats in weekly_stats.items():
        total_actual = stats["act_sum"]
        total_pred = stats["pred_sum"]
        abs_errors = stats["abs_errors"]
        errors = stats["errors"]

        bias = (sum(errors) / total_actual * 100) if total_actual else None
        wmape = (sum(abs_errors) / total_actual * 100) if total_actual else None
        mae = (sum(abs_errors) / stats["count"]) if stats["count"] else None

        results.append({
            "store_id": store_id,
            "week_start": week_start.strftime("%Y-%m-%d"),
            "bias": round(bias, 2) if bias is not None else None,
            "wmape": round(wmape, 2) if wmape is not None else None,
            "mae": round(mae, 2) if mae is not None else None,
            "actuals": round(total_actual, 2),
            "predicted": round(total_pred, 2)
        })
    print("DEBUG: results =", results, flush=True)
    return jsonify(results), 200


@bp.get("/forecast/accuracy/sku")
@role_required
def compare_all_skus_accuracy():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    lookahead_days = user.lookahead_days or 28
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=lookahead_days)

    daily_data = (
        db.session.query(
            Forecast.product_id,
            Forecast.date,
            Forecast.predicted,
            Forecast.actual,
        )
        .filter(Forecast.date >= start_date, Forecast.date <= end_date)
        .filter(Forecast.actual.isnot(None))
        .filter(Forecast.actual != 0)
        .all()
    )

    print(f"DEBUG: daily_data count = {len(daily_data)}", flush=True)
    weekly_stats = defaultdict(lambda: {"errors": [], "abs_errors": [], "pred_sum": 0, "act_sum": 0, "count": 0})

    for row in daily_data:
        week_start = get_week_start(row.date)
        key = (row.product_id, week_start)

        error = row.predicted - row.actual
        abs_error = abs(error)

        weekly_stats[key]["errors"].append(error)
        weekly_stats[key]["abs_errors"].append(abs_error)
        weekly_stats[key]["pred_sum"] += row.predicted
        weekly_stats[key]["act_sum"] += row.actual
        weekly_stats[key]["count"] += 1

    results = []
    for (sku, week_start), stats in weekly_stats.items():
        total_actual = stats["act_sum"]
        total_pred = stats["pred_sum"]
        abs_errors = stats["abs_errors"]
        errors = stats["errors"]

        bias = (sum(errors) / total_actual * 100) if total_actual else None
        wmape = (sum(abs_errors) / total_actual * 100) if total_actual else None
        mae = (sum(abs_errors) / stats["count"]) if stats["count"] else None

        results.append({
            "sku": sku,
            "week_start": week_start.strftime("%Y-%m-%d"),
            "bias": round(bias, 2) if bias is not None else None,
            "wmape": round(wmape, 2) if wmape is not None else None,
            "mae": round(mae, 2) if mae is not None else None,
            "actuals": round(total_actual, 2),
            "predicted": round(total_pred, 2)
        })
    print("DEBUG: results =", results, flush=True)
    return jsonify(results), 200


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
                Forecast.store_id,
                func.date_trunc('week', Forecast.date).label("week_start"),
                func.sum(Forecast.predicted).label("forecast"),
                func.sum(Forecast.actual).label("actual")
            )
            .filter(Forecast.date >= start_date)
            .filter(Forecast.date <= end_date)
            .group_by(Forecast.store_id, func.date_trunc('week', Forecast.date))
            .order_by(Forecast.store_id, "week_start")
            .all()
        )

        # Group into JSON
        results = {}
        for store_id, week_start, forecast, actual in rows:
            week_str = week_start.strftime("%Y-%m-%d")
            results.setdefault(store_id, []).append({
                "week_start": week_str,
                "forecast": float(forecast) if forecast is not None else 0.0,
                "actual": float(actual) if actual is not None else 0.0
            })

        return jsonify(results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🚩 Forecast Run Logs
# In your Flask backend
@bp.route("/forecast/logs", methods=["GET"])
@role_required
def forecast_logs():
    try:
        logs = (
            ForecastLog.query
            .order_by(ForecastLog.run_time.desc())
            .limit(10)
            .all()
        )

        # In your Flask route file
        data = [{
            "id": str(log.id),
            "run_time": log.run_time.strftime("%Y-%m-%d %H:%M:%S") if log.run_time else None,
            "status": log.status,

            # --- FIX THE MISMATCH ---
            "store_id": "N/A", # Or some default value
            "product_id": "N/A", # Or some default value
            "n_weeks": log.n_days / 7 if log.n_days else None # Use the correct field

        } for log in logs]

        return jsonify({"logs": data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# display sku's
@bp.route("/skus", methods=["GET"])
@role_required
def get_skus():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Query distinct SKUs from Forecast table
    skus = (
        db.session.query(Forecast.product_id)
        .distinct()
        .order_by(Forecast.product_id)
        .all()
    )

    sku_list = [row.product_id for row in skus]

    return jsonify({"skus": sku_list}), 200

@bp.route("/forecast/weekly", methods=["POST"])
@role_required
def weekly_forecast():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(silent=True) or {}
    store_ids = body.get("store_ids")
    skus = body.get("skus")

    # ✅ Fetch user and lookahead_days
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    lookahead_days = user.lookahead_days or 28  # fallback = 4 weeks
    lookahead_weeks = max(1, lookahead_days // 7)

    # ✅ Past weeks = lookahead_weeks unless user overrides
    past_weeks = body.get("past_weeks", lookahead_weeks)
    if not isinstance(past_weeks, int) or past_weeks <= 0:
        return jsonify({"error": "Invalid past_weeks value"}), 400

    # ✅ Future weeks = lookahead_weeks unless user overrides
    future_weeks = body.get("future_weeks", lookahead_weeks)
    if not isinstance(future_weeks, int) or future_weeks < 0:
        return jsonify({"error": "Invalid future_weeks value"}), 400

    today = datetime.utcnow().date()
    start_date = today - timedelta(weeks=past_weeks)
    end_date = today + timedelta(weeks=future_weeks)

    print(f"[DEBUG] Weekly forecast range: {start_date} → {end_date} "
          f"(past {past_weeks} weeks, future {future_weeks} weeks)")

    # ✅ Map store_ids to store_codes
    store_codes = None
    if store_ids and isinstance(store_ids, list):
        code_rows = (
            db.session.query(Store.store_id, Store.store_code)
            .filter(Store.store_id.in_(store_ids))
            .all()
        )
        store_codes = [row.store_code for row in code_rows]

    # ✅ Query forecast/actuals in range
    query = (
        db.session.query(
            Forecast.store_id.label("store_code"),
            Forecast.product_id.label("sku"),
            func.date_trunc("week", Forecast.date).label("week_start"),
            func.sum(Forecast.predicted).label("weekly_forecast"),
            func.sum(Forecast.actual).label("weekly_actual")
        )
        .filter(Forecast.date >= start_date, Forecast.date <= end_date)
    )

    if store_codes:
        query = query.filter(Forecast.store_id.in_(store_codes))
    if skus and isinstance(skus, list):
        query = query.filter(Forecast.product_id.in_(skus))

    query = query.group_by(
        Forecast.store_id, Forecast.product_id, func.date_trunc("week", Forecast.date)
    ).order_by("week_start")

    results = query.all()

    response = []
    for row in results:
        if row.weekly_forecast is None and row.weekly_actual is None:
            continue

        record = {
            "store_code": row.store_code,
            "sku": row.sku,
            "week_start": row.week_start.strftime("%Y-%m-%d"),
            "weekly_forecast": int(row.weekly_forecast) if row.weekly_forecast else None,
            "weekly_actual": int(row.weekly_actual) if row.weekly_actual else None
        }
        response.append(record)

    return jsonify({"forecasts": response}), 200



@bp.route("/forecast/accuracy/overall", methods=["GET"])
def get_overall_accuracy():
    """
    Returns overall forecast accuracy for past N weeks (default = user's lookahead_weeks).
    Query Params:
      weeks -> number of past weeks to include (optional)
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # ✅ allow user override
    weeks_param = request.args.get("weeks", type=int)
    lookahead_weeks = weeks_param if weeks_param and weeks_param > 0 else int(user.lookahead_days // 7 or 4)

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(weeks=lookahead_weeks)

    print(f"[DEBUG] Computing overall accuracy for past {lookahead_weeks} weeks ({start_date} → {end_date})")

    daily_data = (
        db.session.query(Forecast.date, Forecast.predicted, Forecast.actual)
        .filter(Forecast.date >= start_date, Forecast.date <= end_date)
        .filter(Forecast.actual.isnot(None))
        .filter(Forecast.actual != 0)
        .all()
    )

    if not daily_data:
        print("[DEBUG] No data found in selected date range.")
        return jsonify({"results": []}), 200

    weekly_stats = defaultdict(lambda: {"errors": [], "abs_errors": [], "pred_sum": 0, "act_sum": 0, "count": 0})

    for row in daily_data:
        week_start = get_week_start(row.date)
        weekly_stats[week_start]["errors"].append(row.predicted - row.actual)
        weekly_stats[week_start]["abs_errors"].append(abs(row.predicted - row.actual))
        weekly_stats[week_start]["pred_sum"] += row.predicted
        weekly_stats[week_start]["act_sum"] += row.actual
        weekly_stats[week_start]["count"] += 1

    results = []
    for week_start, stats in sorted(weekly_stats.items()):
        total_actual = stats["act_sum"]
        total_pred = stats["pred_sum"]
        bias = (sum(stats["errors"]) / total_actual * 100) if total_actual else None
        wmape = (sum(stats["abs_errors"]) / total_actual * 100) if total_actual else None
        mae = (sum(stats["abs_errors"]) / stats["count"]) if stats["count"] else None

        results.append({
            "week_start": week_start.strftime("%Y-%m-%d"),
            "actuals": round(total_actual, 2),
            "forecast": round(total_pred, 2),
            "bias": round(bias, 2) if bias is not None else None,
            "wmape": round(wmape, 2) if wmape is not None else None,
            "mae": round(mae, 2) if mae is not None else None
        })

    print(f"[DEBUG] Generated results for {len(results)} week(s).")
    return jsonify({"results": results}), 200


@bp.route("/forecast/accuracy/detail", methods=["GET"])
@role_required
def get_detailed_accuracy():
    """
    Returns breakdown by week, sku, store.
    Query Params:
      weeks (comma-separated week_start dates) -> default = last lookahead_weeks
      sku (comma-separated product_ids) -> optional
      store (comma-separated numeric store_ids) -> optional
      granularity = "week" | "day" -> default = week
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    lookahead_weeks = user.lookahead_days // 7 or 4
    end_date = datetime.utcnow().date()
    default_start_date = end_date - timedelta(weeks=lookahead_weeks)

    weeks_param = request.args.get("weeks")
    skus_param = request.args.get("sku")
    stores_param = request.args.get("store")
    granularity = request.args.get("granularity", "week").lower()

    # Week filter
    if weeks_param:
        week_starts = [datetime.strptime(w.strip(), "%Y-%m-%d").date() for w in weeks_param.split(",") if w.strip()]
        min_date = min(week_starts)
        max_date = max(week_starts) + timedelta(days=6)
    else:
        min_date, max_date = default_start_date, end_date

    print(f"[DEBUG] Requested date range: {min_date} → {max_date}")
    if skus_param:
        print(f"[DEBUG] Filtering by SKUs: {skus_param}")
    if stores_param:
        print(f"[DEBUG] Filtering by Stores: {stores_param}")
    print(f"[DEBUG] Granularity: {granularity}")

    query = db.session.query(
        Forecast.store_id, Forecast.product_id, Forecast.date, Forecast.predicted, Forecast.actual
    ).filter(Forecast.date >= min_date, Forecast.date <= max_date)\
     .filter(Forecast.actual.isnot(None))\
     .filter(Forecast.actual != 0)

    # SKU filter
    if skus_param:
        skus = [s.strip() for s in skus_param.split(",") if s.strip()]
        query = query.filter(Forecast.product_id.in_(skus))

    # Store filter (map numeric store_id → store_code list)
    if stores_param:
        numeric_ids = [int(s.strip()) for s in stores_param.split(",") if s.strip().isdigit()]
        if numeric_ids:
            store_codes = [s.store_code for s in db.session.query(Store).filter(Store.store_id.in_(numeric_ids))]
            print(f"[DEBUG] Mapped store_ids {numeric_ids} → store_codes {store_codes}")
            if store_codes:
                query = query.filter(Forecast.store_id.in_(store_codes))

    daily_data = query.all()
    print(f"[DEBUG] Total rows fetched from DB: {len(daily_data)}")

    if not daily_data:
        return jsonify({"message": "No data found for given filters", "results": []}), 200

    # Group and aggregate results
    grouped_stats = defaultdict(lambda: {"errors": [], "abs_errors": [], "pred_sum": 0, "act_sum": 0, "count": 0})
    for row in daily_data:
        key = (row.date,) if granularity == "day" else (get_week_start(row.date),)
        grouped_stats[key]["errors"].append(row.predicted - row.actual)
        grouped_stats[key]["abs_errors"].append(abs(row.predicted - row.actual))
        grouped_stats[key]["pred_sum"] += row.predicted
        grouped_stats[key]["act_sum"] += row.actual
        grouped_stats[key]["count"] += 1

    result_key = "date" if granularity == "day" else "week_start"
    results = []
    for key, stats in grouped_stats.items():
        total_actual = stats["act_sum"]
        total_pred = stats["pred_sum"]
        bias = (sum(stats["errors"]) / total_actual * 100) if total_actual else None
        wmape = (sum(stats["abs_errors"]) / total_actual * 100) if total_actual else None
        mae = (sum(stats["abs_errors"]) / stats["count"]) if stats["count"] else None
        results.append({
            result_key: key[0].strftime("%Y-%m-%d"),
            "actuals": round(total_actual, 2),
            "predicted": round(total_pred, 2),
            "bias": round(bias, 2) if bias is not None else None,
            "wmape": round(wmape, 2) if wmape is not None else None,
            "mae": round(mae, 2) if mae is not None else None
        })

    return jsonify({"results": sorted(results, key=lambda x: x[result_key])}), 200
