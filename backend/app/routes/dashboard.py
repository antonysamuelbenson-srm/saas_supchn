from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
from app.models.dashboard import DashboardMetrics
from app.models.predict import Forecast
from app.models.inventory import InventorySnapshot
from app.models.user import User
import os
from collections import defaultdict
from app import db
from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required
import logging

logger = logging.getLogger(__name__)

bp = Blueprint("dashboard", __name__)

# ───────────────────────────────────────────────
# ✅ Use only DATABASE_URL from environment
# ───────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL not found in environment variables.")
else:
    print("✅ Successfully fetching from DATABASE_URL")


def r2(x, places=2):
    """Round a numeric value safely."""
    return round(float(x), places) if x not in (None, "") else None


# ───────────────────────────────────────────────
# RECOMPUTE DASHBOARD METRICS
# ───────────────────────────────────────────────
@bp.route("/dashboard/recompute", methods=["POST"])
@role_required
def recompute_dashboard_metrics():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        uid = decode_jwt(token).get("role_user_id")
        if not uid:
            return jsonify({"error": "Unauthorized"}), 401

        # Latest inventory snapshot
        latest_date = db.session.query(db.func.max(InventorySnapshot.snapshot_date)).scalar()
        if not latest_date:
            return jsonify({"error": "No inventory snapshots found"}), 404

        inv_rows = (
            InventorySnapshot.query
            .filter(InventorySnapshot.snapshot_date == latest_date)
            .all()
        )

        # User config
        user_config = db.session.query(User).filter_by(role_user_id=uid).first()
        lookahead_days = int(getattr(user_config, "lookahead_days", 14))

        # Forecast period
        today = datetime.now(timezone.utc).date()
        forecast_cutoff = today + timedelta(days=lookahead_days)

        forecast_rows = (
            Forecast.query
            .filter(Forecast.date >= today, Forecast.date <= forecast_cutoff)
            .order_by(Forecast.date)
            .all()
        )

        current_demand = sum(float(r.predicted or 0) for r in forecast_rows)
        inv_total = r2(sum(float(r.qty) for r in inv_rows))

        # Weeks of supply
        weeks_of_supply = None
        if forecast_rows:
            unique_days = len(set(f.date for f in forecast_rows))
            if unique_days > 0:
                total_forecast = sum(float(f.predicted or 0) for f in forecast_rows)
                avg_daily = total_forecast / unique_days
                weeks_of_supply = r2(inv_total / (avg_daily * 7), 1)

        inventory_position = r2(inv_total)
        projected_stockouts = 0

        # Fill rate probability
        sku_demand = defaultdict(float)
        for f in forecast_rows:
            sku_demand[(f.store_id, f.product_id)] += float(f.predicted or 0)

        total_skus = len(inv_rows)
        fulfilled_skus = sum(
            1 for r in inv_rows
            if float(r.qty) >= sku_demand.get((r.store_id, r.sku), 0)
        )
        fill_rate_probability = r2((fulfilled_skus / total_skus) * 100) if total_skus else 0

        # Save metrics
        metric_entry = DashboardMetrics(
            inventory_position=int(inventory_position),
            weeks_of_supply=weeks_of_supply,
            projected_stockouts=projected_stockouts,
            fill_rate_probability=fill_rate_probability,
            timestamp=datetime.utcnow()
        )
        db.session.add(metric_entry)
        db.session.commit()

        return jsonify({
            "inventory_position": inventory_position,
            "weeks_of_supply": weeks_of_supply,
            "lookahead_days_used": lookahead_days,
            "current_demand": current_demand
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Recompute failed: {e}")
        return jsonify({"error": "Failed to update metrics"}), 500


# ───────────────────────────────────────────────
# MAIN DASHBOARD VIEW
# ───────────────────────────────────────────────
@bp.route("/dashboard", methods=["GET"])
@role_required
def dashboard():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        uid = decode_jwt(token).get("role_user_id")
        if not uid:
            return jsonify({"error": "Unauthorized"}), 401

        # User config
        user_config = db.session.query(User).filter_by(role_user_id=uid).first()
        lookahead_days = int(getattr(user_config, "lookahead_days", 14))
        print(f"🔍 lookahead_days used: {lookahead_days}")

        # Latest inventory snapshot
        latest_date = db.session.query(db.func.max(InventorySnapshot.snapshot_date)).scalar()
        if not latest_date:
            return jsonify({"error": "No inventory snapshots found"}), 404

        inv_rows = (
            InventorySnapshot.query
            .filter(InventorySnapshot.snapshot_date == latest_date)
            .all()
        )

        # Forecast
        today = datetime.now(timezone.utc).date()
        forecast_cutoff = today + timedelta(days=lookahead_days)

        forecast_rows = (
            Forecast.query
            .filter(Forecast.date >= today, Forecast.date <= forecast_cutoff)
            .order_by(Forecast.date)
            .all()
        )

        # Calculate metrics
        current_demand = 0.0
        forecast_dates = set()
        sku_demand = defaultdict(float)

        for r in forecast_rows:
            forecast_dates.add(r.date)
            pred_val = float(r.predicted or 0)
            current_demand += pred_val
            sku_demand[(r.store_id, r.product_id)] += pred_val

        forecast_msg = (
            f"⚠️ Forecast data available only for {len(forecast_dates)} days."
            if forecast_dates and len(forecast_dates) < lookahead_days
            else "✅ Forecast data sufficient."
        )

        inv_total = r2(sum(float(r.qty) for r in inv_rows))
        inventory_position = inv_total

        # Weeks of supply
        weeks_of_supply = None
        if forecast_rows:
            unique_days = len(forecast_dates)
            if unique_days > 0:
                avg_daily = current_demand / unique_days
                if avg_daily > 0:
                    weeks_of_supply = r2(inv_total / (avg_daily * 7), 1)

        # Projected stockouts
        projected_stockouts = 0
        for row in inv_rows:
            qty = float(row.qty)
            adu = float(getattr(row, "avg_daily_usage", 0))
            lt = int(getattr(row, "lead_time_days", 0))
            if adu > 0:
                days_cover = r2(qty / adu, 1)
                if days_cover is not None and lt > 0 and days_cover <= lt:
                    projected_stockouts += 1

        # Fill rate
        total_skus = len(inv_rows)
        fulfilled_skus = sum(
            1 for r in inv_rows
            if float(r.qty) >= sku_demand.get((r.store_id, r.sku), 0)
        )
        fill_rate_probability = r2((fulfilled_skus / total_skus) * 100) if total_skus > 0 else 0

        # Response
        out = {
            "current_demand": int(round(current_demand)),
            "inventory_position": int(round(inventory_position)),
            "weeks_of_supply": int(round(weeks_of_supply)) if weeks_of_supply is not None else None,
            "projected_stockouts": projected_stockouts,
            "fill_rate_probability": fill_rate_probability,
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "forecast_msg": forecast_msg,
            "lookahead_days_used": lookahead_days
        }

        return jsonify(out), 200

    except Exception as e:
        logger.error(f"Failed to load dashboard: {e}")
        return jsonify({"error": "Internal server error"}), 500