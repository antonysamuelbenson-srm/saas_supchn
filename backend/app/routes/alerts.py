from __future__ import annotations

from flask import Blueprint, request, jsonify
from sqlalchemy import desc, func
from app import db
from app.models.alert import Alert
from app.utils.jwt_utils import decode_jwt
from app.utils.kpi_calc import generate_alerts    
from datetime import date, timedelta
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
from app.models.reorder_config import ReorderConfig
from app.utils.decorators import role_required

bp = Blueprint("alerts", __name__, url_prefix="/alerts")

# ──────────────────────────────────────────────────────────
def _current_user():
    """Returns role_user_id or None if token is missing/invalid."""
    token   = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    return payload.get("role_user_id") if payload else None

def _serialise(a: Alert) -> dict:
    return {
        "type"      : a.type,
        "severity"  : a.severity,
        "message"   : a.message,
        "sku"       : a.sku,
        "store_id"  : a.store_id,
        "created_at": a.created_at.isoformat(),
    }

# ──────────────────────────────────────────────────────────
@bp.get("")           # ← GET /alerts
def list_alerts():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    alerts = (
        Alert.query
        .order_by(desc(Alert.created_at))
        .all()
    )
    return jsonify([_serialise(a) for a in alerts]), 200   # ← explicit status

# ──────────────────────────────────────────────────────────
@bp.post("/refresh")  # ← POST /alerts/refresh
@role_required
def refresh_alerts():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Unauthorized"}), 401

    # optional: clear existing alerts to avoid duplicates
    Alert.query.delete()
    db.session.commit()

    inserted = generate_alerts(uid)
    return jsonify({"inserted": inserted}), 200


@bp.route("/check-stockout-after-reorder", methods=["POST"])
@role_required
def check_stockout_after_reorder():
    try:
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        payload = decode_jwt(token)
        role_user_id = payload.get("role_user_id")

        today = date.today()
        stockout_alerts = 0
        reorder_alerts = 0

        # Step 1: Get current inventory snapshot (latest per store+sku)
        latest_inventory = db.session.query(
            InventorySnapshot.store_id,
            InventorySnapshot.sku,
            func.max(InventorySnapshot.snapshot_date).label("latest_date")
        ).group_by(
            InventorySnapshot.store_id,
            InventorySnapshot.sku
        ).subquery()

        inventory_data = db.session.query(
            InventorySnapshot.store_id,
            InventorySnapshot.sku,
            InventorySnapshot.qty
        ).join(latest_inventory, 
               (InventorySnapshot.store_id == latest_inventory.c.store_id) &
               (InventorySnapshot.sku == latest_inventory.c.sku) &
               (InventorySnapshot.snapshot_date == latest_inventory.c.latest_date)
        ).all()

        for inv in inventory_data:
            store_id = str(inv.store_id)
            sku = inv.sku
            current_qty = float(inv.qty or 0)

            config = db.session.query(ReorderConfig).filter_by(
                store_id=store_id,
                sku=sku
            ).first()

            if not config:
                continue

            lead_time_days = config.lead_time_days or 7
            reorder_point = float(config.reorder_point or 0)
            safety_stock = float(config.safety_stock or 0)
            reorder_threshold = reorder_point + safety_stock
            reorder_qty = max(0, reorder_threshold - current_qty)

            # Forecasted demand within lead time window
            end_date = today + timedelta(days=lead_time_days)
            forecast_demand = db.session.query(
                func.sum(ForecastDaily.forecast_qty)
            ).filter(
                ForecastDaily.store_id == store_id,
                ForecastDaily.sku == sku,
                ForecastDaily.forecast_date >= today,
                ForecastDaily.forecast_date <= end_date
            ).scalar() or 0

            # Raise reorder alert if reorder_qty > 0
            if reorder_qty > 0:
                reorder_alerts += 1
                reorder_msg = (
                    f"SKU {sku} at Store {store_id} requires reorder. "
                    f"Reorder threshold = {reorder_threshold}, Current = {current_qty}, "
                    f"Recommended reorder = {reorder_qty}."
                )
                existing_alert = db.session.query(Alert).filter_by(
                    store_id=store_id,
                    sku=sku,
                    type="Reorder Needed"
                ).first()
                if not existing_alert:
                    db.session.add(Alert(
                        store_id=store_id,
                        sku=sku,
                        type="Reorder Needed",
                        severity="Medium",
                        message=reorder_msg,
                        role_user_id=role_user_id 
                    ))

            # Projected stock after reorder
            projected_qty = current_qty + reorder_qty

            if forecast_demand > projected_qty:
                stockout_alerts += 1
                stockout_msg = (
                    f"Stockout risk for SKU {sku} at Store {store_id}. "
                    f"Forecasted demand ({forecast_demand}) over {lead_time_days}d "
                    f"exceeds projected inventory ({projected_qty})."
                )
                existing_stockout = db.session.query(Alert).filter_by(
                    store_id=store_id,
                    sku=sku,
                    type="Stockout Despite Reorder"
                ).first()
                if not existing_stockout:
                    db.session.add(Alert(
                        store_id=store_id,
                        sku=sku,
                        type="Stockout Despite Reorder",
                        severity="High",
                        message=stockout_msg,
                        role_user_id=role_user_id 
                    ))

        db.session.commit()

        return jsonify({
            "message": f"{stockout_alerts} stockout alerts and {reorder_alerts} reorder alerts raised.",
            "num_stockouts": stockout_alerts,
            "num_reorders_required": reorder_alerts
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
