from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from datetime import datetime, timezone, timedelta
from app.models.dashboard import DashboardMetrics
import os, dotenv
from collections import defaultdict
from app import db
from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required
import logging
logger = logging.getLogger(__name__)

dotenv.load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"),os.getenv("ANON_KEY"))

bp = Blueprint("dashboard", __name__)

def r2(x, places=2):
    return round(float(x), places) if x not in (None, "") else None

@bp.route("/dashboard/recompute", methods=["POST"])
@role_required
def recompute_dashboard_metrics():
    try:
        # ── Fetch latest inventory snapshot ──────────────────
        inv_rows = (supabase.table("inventory")
                    .select("store_id, sku, qty, product_name, snapshot_date")
                    .execute()).data or []

        for row in inv_rows:
            row["snapshot_date"] = datetime.strptime(row["snapshot_date"], "%Y-%m-%d").date()
        latest_date = max(r["snapshot_date"] for r in inv_rows)
        inv_rows = [r for r in inv_rows if r["snapshot_date"] == latest_date]

        # ── Reorder config ───────────────────────────────────
        rc_rows = (supabase.table("reorder_config")
                      .select("store_id, sku, avg_daily_usage, lead_time_days, safety_stock, reorder_point")
                      .execute()).data or []

        # ── Forecast demand calculation ──────────────────────
        today = datetime.now(timezone.utc).date()
        lookahead_days = 14
        forecast_cutoff = today + timedelta(days=lookahead_days)
        forecast_rows = (
            supabase.table("forecast_daily")
            .select("store_id, sku, forecast_qty, forecast_date")
            .order("forecast_date")
            .execute()
        ).data or []

        current_demand = 0.0
        for r in forecast_rows:
            try:
                forecast_date = datetime.strptime(r["forecast_date"], "%Y-%m-%d").date()
                if today <= forecast_date <= forecast_cutoff:
                    current_demand += float(r.get("forecast_qty") or 0)
            except Exception:
                continue

        # ── Metrics ──────────────────────────────────────────
        inv_total = r2(sum(float(r["qty"]) for r in inv_rows))
        adu_vals = [float(r["avg_daily_usage"]) for r in rc_rows if r["avg_daily_usage"]]
        avg_adu = (sum(adu_vals) / len(adu_vals)) if adu_vals else None
        weeks_of_supply = r2(inv_total / (avg_adu * 7), 1) if avg_adu else None
        rop_total = sum(float(r["reorder_point"] or 0) for r in rc_rows)
        inventory_position = r2(inv_total)

        rc_map = {(r["store_id"], r["sku"]): r for r in rc_rows}
        projected_stockouts = 0

        for row in inv_rows:
            sid, sku = row["store_id"], row["sku"]
            qty = float(row["qty"])
            rc = rc_map.get((sid, sku), {})
            adu = rc.get("avg_daily_usage") or 0
            lt = rc.get("lead_time_days") or 0
            days_cover = r2(qty / adu, 1) if adu else None
            if days_cover is not None and lt and days_cover <= lt:
                projected_stockouts += 1

        # ── Fill rate (global, simplified) ───────────────────
        sku_demand = defaultdict(float)
        for f in forecast_rows:
            sku_demand[(f["store_id"], f["sku"])] += float(f.get("forecast_qty") or 0)

        total_skus = len(inv_rows)
        fulfilled_skus = sum(
            1 for r in inv_rows
            if float(r["qty"]) >= sku_demand.get((r["store_id"], r["sku"]), 0)
        )
        fill_rate_probability = r2((fulfilled_skus / total_skus) * 100) if total_skus else 0

        # ── Insert into DB ───────────────────────────────────
        metric_entry = DashboardMetrics(
            inventory_position=int(inventory_position),
            weeks_of_supply=weeks_of_supply,
            projected_stockouts=projected_stockouts,
            fill_rate_probability=fill_rate_probability,
            timestamp=datetime.utcnow()
        )
        db.session.add(metric_entry)
        db.session.commit()

        return jsonify({"message": "Metrics updated successfully"}), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Recompute failed: {e}")
        return jsonify({"error": "Failed to update metrics"}), 500


@bp.route("/dashboard", methods=["GET"])
@role_required
def dashboard():
    try:
        # ── Get user info from token ─────────────────────────
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        uid = decode_jwt(token).get("role_user_id")
        if not uid:
            return jsonify({"error": "Unauthorized"}), 401

        # ── Get latest dashboard metrics from DB ─────────────
        latest_metrics = (DashboardMetrics.query
                          .order_by(DashboardMetrics.timestamp.desc())
                          .first())

        if not latest_metrics:
            return jsonify({"error": "No dashboard metrics available"}), 404

        # ── Get user config (lookahead_days) ─────────────────
        user_config = (supabase.table("user")
            .select("lookahead_days")
            .eq("role_user_id", uid)
            .single()
            .execute()).data or {}

        lookahead_days = int(user_config.get("lookahead_days", 14))

        # ── Calculate current_demand live ────────────────────
        today = datetime.now(timezone.utc).date()
        forecast_cutoff = today + timedelta(days=lookahead_days)

        forecast_rows = (
            supabase.table("forecast_daily")
            .select("forecast_qty, forecast_date")
            .order("forecast_date")
            .execute()
        ).data or []

        current_demand = 0.0
        forecast_dates = []

        for r in forecast_rows:
            try:
                forecast_date = datetime.strptime(r["forecast_date"], "%Y-%m-%d").date()
                if today <= forecast_date <= forecast_cutoff:
                    forecast_dates.append(forecast_date)
                    current_demand += float(r.get("forecast_qty") or 0)
            except Exception as e:
                logger.warning(f"Skipping forecast row: {r.get('forecast_date')} → {e}")

        # ── Forecast health message ──────────────────────────
        forecast_msg = (
            f"⚠️ Forecast data available only for {len(set(forecast_dates))} days."
            if forecast_dates and len(set(forecast_dates)) < lookahead_days
            else "✅ Forecast data sufficient."
        )

        # ── Build final response ─────────────────────────────
        out = {
            "current_demand": r2(current_demand),
            "inventory_position": latest_metrics.inventory_position,
            "weeks_of_supply": latest_metrics.weeks_of_supply,
            "projected_stockouts": latest_metrics.projected_stockouts,
            "fill_rate_probability": r2(latest_metrics.fill_rate_probability),
            "timestamp": latest_metrics.timestamp.isoformat(timespec="seconds"),
            "forecast_msg": forecast_msg
        }

        return jsonify(out), 200

    except Exception as e:
        logger.error(f"Failed to load dashboard: {e}")
        return jsonify({"error": "Internal server error"}), 500
