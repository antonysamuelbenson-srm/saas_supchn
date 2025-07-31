from app import db
from sqlalchemy import func
from datetime import timedelta,date
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
from app.models.reorder_config import ReorderConfig
from app.models.reorder import Reorder
from flask import Blueprint,request, jsonify
from app.utils.decorators import role_required

bp = Blueprint("reorder", __name__)

@bp.route("/reorder/generate", methods=["GET"])
@role_required
def generate_reorders():
    snapshot_date_str = request.args.get("snapshot_date")
    if not snapshot_date_str:
        return jsonify({"error": "snapshot_date is required"}), 400

    snapshot_date = date.fromisoformat(snapshot_date_str)
    """
    Check all inventory levels as of `snapshot_date`, and return reorders 
    where inventory <= reorder_point for that store_id/sku.
    """

    # 1. Get latest inventory snapshot
    inventory_subq = db.session.query(
        InventorySnapshot.store_id,
        InventorySnapshot.sku,
        InventorySnapshot.qty.label("current_qty")
    ).filter(
        InventorySnapshot.snapshot_date == snapshot_date
    ).subquery()

    # 2. Get reorder configs
    config_subq = db.session.query(
        ReorderConfig.store_id,
        ReorderConfig.sku,
        ReorderConfig.lead_time_days,
        ReorderConfig.reorder_point
    ).subquery()

    # 3. Join inventory with config
    joined = db.session.query(
        inventory_subq.c.store_id,
        inventory_subq.c.sku,
        inventory_subq.c.current_qty,
        config_subq.c.lead_time_days,
        config_subq.c.reorder_point
    ).join(
        config_subq,
        (inventory_subq.c.store_id == config_subq.c.store_id) &
        (inventory_subq.c.sku == config_subq.c.sku)
    ).all()

    reorder_candidates = []

    for row in joined:
        store_id = row.store_id
        sku = row.sku
        current_qty = row.current_qty
        reorder_point = row.reorder_point
        lead_time = row.lead_time_days

        if current_qty is None or reorder_point is None:
            continue  # skip incomplete configs

        if current_qty <= reorder_point:
            # 4. Sum forecast demand for lead_time_days ahead
            future_forecast_sum = db.session.query(
                func.sum(ForecastDaily.forecast_qty)
            ).filter(
                ForecastDaily.store_id == store_id,
                ForecastDaily.sku == sku,
                ForecastDaily.forecast_date > snapshot_date,
                ForecastDaily.forecast_date <= snapshot_date + timedelta(days=lead_time)
            ).scalar() or 0

            reorder_qty = float(future_forecast_sum) - float(current_qty)
            if reorder_qty > 0:
                reorder_candidates.append({
                    "store_id": store_id,
                    "sku": sku,
                    "reorder_date": snapshot_date,
                    "qty": int(round(reorder_qty)),
                    "lead_time_days": lead_time
                })

    return jsonify(reorder_candidates)


@bp.route("/reorder/place", methods=["POST"])
@role_required
def place_orders_based_on_user_selection():
    payload = request.get_json()
    selected_orders = payload.get("items", [])
    reorder_date = payload.get("reorder_date", date.today().isoformat())
    """
    selected_orders: list of dicts with keys: store_id, sku, reorder_qty
    """
    today = date.today()

    new_orders = []
    for order in selected_orders:
        if not all(k in order for k in ("store_id", "sku", "qty")):
            return jsonify({"error": "Invalid order payload"}), 400
        reorder = Reorder(
    store_id=order["store_id"],
    sku=order["sku"],
    qty=order["qty"],
    reorder_date=reorder_date,
    lead_time_days=order.get("lead_time_days", 0)
)

        new_orders.append(reorder)

    db.session.add_all(new_orders)
    db.session.commit()
    return jsonify({"status": "success", "orders_placed": len(new_orders)})
