from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from datetime import date, timedelta
from app.utils.jwt_utils import decode_jwt
from collections import Counter
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
from app.models.user import User
from app.models.store import Store
from app.models.reorder_config import ReorderConfig
from app.utils.kpi_calc import _emit
from app import db
from dotenv import load_dotenv
import os
from app.utils.decorators import role_required

load_dotenv()
supabase: Client = create_client(os.environ["SUPABASE_URL"],
                                 os.environ["ANON_KEY"])

bp = Blueprint("store", __name__)


# ─────────────────────────────────────────────────────────────────────────────
# 1.  POST /store_upload  – add one store row
# ─────────────────────────────────────────────────────────────────────────────
@bp.route("/store_upload", methods=["POST"])
@role_required
def store_upload():
    # ── auth ────────────────────────────────────────────
    token   = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # ── basic validation ───────────────────────────────
    data = request.get_json(silent=True) or {}
    needed = ("store_code", "name", "address", "city")
    missing = [k for k in needed if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing field(s): {', '.join(missing)}"}), 400

    store_code = data["store_code"].strip()

    # ── duplicate check ────────────────────────────────
    try:
        dup = (
            supabase.table("store_data")
            .select("store_id")
            .eq("store_code", store_code)
            .maybe_single()
            .execute()
        )
        if dup and dup.data:
            return jsonify({"message": "⚠️ Store already exists",
                            "store_id": dup.data["store_id"]}), 200
    except Exception as e:
        return jsonify({"error": f"Lookup failed: {str(e)}"}), 500

    # ── build row safely ───────────────────────────────
    def to_float(x):
        try: return float(x)
        except (TypeError, ValueError): return None

    row = {
        "role_user_id"  : role_user_id,
        "store_code"    : store_code,
        "name"          : data["name"].strip(),
        "address"       : data["address"].strip(),
        "city"          : data["city"].strip(),
        "state"         : data.get("state"),
        "country"       : data.get("country"),
        "lat"           : to_float(data.get("lat")),
        "long"          : to_float(data.get("long")),
        "capacity_units": to_float(data.get("capacity_units")),
    }

    # ── insert ─────────────────────────────────────────
    try:
        res = supabase.table("store_data").insert(row).execute()
        if not res or not res.data:
            return jsonify({"error": "Insert failed or returned no data"}), 400
        # ✅ SUCCESS RESPONSE
        return jsonify({"message": "✅ Store added", "store": res.data[0]}), 201
    except Exception as e:
        return jsonify({"error": f"Insertion error: {str(e)}"}), 500

    # fallback (should never hit)
    return jsonify({"error": "Unexpected flow in store_upload"}), 500


# ─────────────────────────────────────────────────────────────────────────────
# 2.  GET /stores  – map bubbles / cards
# ─────────────────────────────────────────────────────────────────────────────
@bp.route("/stores", methods=["GET"])
@role_required
def all_stores():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # pull stores
    stores = (supabase.table("store_data")
                     .select("*")
                     .execute()).data or []

    # 1. Alert counts per store
    alert_rows = (supabase.table("alert")
                            .select("store_id")
                            .execute()).data or []
    alert_map = dict(
    Counter(int(r["store_id"])           # cast 
            for r in alert_rows
            if r.get("store_id") is not None)
)
    # 2. Inventory stats per store: SKU count and last update
    inv_rows = (supabase.table("inventory")
                        .select("store_id,sku,snapshot_date")
                        .execute()).data 

    inv_map = {}
    for row in inv_rows:
        sid = int(row["store_id"])
        if sid not in inv_map:
            inv_map[sid] = {
                "sku_set": set(),
                "last_update": row.get("snapshot_date")
            }
        inv_map[sid]["sku_set"].add(row["sku"])
        
        # Update latest snapshot date
        date_str = row.get("snapshot_date")
        if date_str:
            prev = inv_map[sid]["last_update"]
            inv_map[sid]["last_update"] = max(prev, date_str)

    # Convert sku_set to count
    for sid, v in inv_map.items():
        v["sku_total"] = len(v["sku_set"])
        v["last_update"] = v["last_update"]


    out = []
    for s in stores:
        stats = inv_map.get(int(s["store_id"]), {})
        out.append({
            "store_id":    s["store_id"],
            "name":        s["name"],
            "city":        s["city"],
            "lat":         float(s["lat"])  if s["lat"]  is not None else None,
            "lon":         float(s["long"]) if s["long"] is not None else None,
            "sku_total":   stats.get("sku_total", 0),
            "alert_total": alert_map.get(s["store_id"], 0),
            "last_update": stats.get("last_update"),
        })
    return jsonify({"stores": out}), 200


# ─────────────────────────────────────────────────────────────────────────────
# 3.  GET /store/<id>/summary  – one‑store deep dive
# ─────────────────────────────────────────────────────────────────────────────
@bp.route("/store/<int:store_id>/summary", methods=["GET"])
@role_required
def single_store_summary(store_id: int):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # make sure the store belongs to this tenant
    store_res = (supabase.table("store_data")
                         .select("*")
                         .eq("store_id", store_id)
                         .maybe_single()
                         .execute())
    if store_res.data is None:
        return jsonify({"error": "Store not found"}), 404

    store = store_res.data

    # inventory rows for this store
    inv = (supabase.table("inventory")
                   .select("*")
                   .eq("store_id", store_id)
                   .execute()).data or []

    # reorder_config for this store
    rc_rows = (supabase.table("reorder_config")
                        .select("*")
                        .eq("store_id", store_id)
                        .execute()).data or []
    rc_map = {r["sku"]: r for r in rc_rows}

    # alerts for this store
    alerts = (supabase.table("alert")
                      .select("*")
                      .eq("store_id", store_id)
                      .order("created_at", desc=True)
                      .execute()).data or []

    # group alerts by type, hide empty buckets
    alert_out = {}
    for a in alerts:
        t = a["type"].lower()          # stock_out, excess, …
        bucket = alert_out.setdefault(t, {"count": 0, "items": []})
        bucket["items"].append({
            "sku":      a["sku"],
            "message":  a["message"],
            "severity": a["severity"],
            "at":       a["created_at"],
        })
        bucket["count"] += 1

    items_out = []
    for row in inv:
        sku = row["sku"]
        rc  = rc_map.get(sku, {})
        items_out.append({
            "sku":            sku,
            "quantity":       row["qty"],
            "avg_daily_usage": rc.get("avg_daily_usage"),
            "lead_time_days":  rc.get("lead_time_days"),
            "safety_stock":   rc.get("safety_stock"),
            "reorder_point":  rc.get("reorder_point"),
        })

    store_key = f"{store['name']} | {store['city']}"
    return jsonify({store_key: {"alerts": alert_out, "items": items_out}}), 200

@bp.route("/store/<int:store_id>/hover", methods=["GET"])
def hovered_store_stats(store_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Inventory info
    # checks the latest snapshot 
    latest_snapshot = (supabase.table("inventory")
                    .select("snapshot_date")
                    .eq("store_id", str(store_id))
                    .order("snapshot_date", desc=True)   # newest first
                    .limit(1)
                    .execute()).data

    if latest_snapshot:
        latest_date = latest_snapshot[0]["snapshot_date"]
        inv_rows = (supabase.table("inventory")
                .select("sku,qty")
                .eq("store_id", str(store_id))
                .eq("snapshot_date", latest_date)
                .execute()).data or []

    distinct_skus = set()
    total_inventory_units = 0
    for row in inv_rows:
        if row.get("sku"):
            distinct_skus.add(row["sku"])
        if row.get("qty") is not None:
            total_inventory_units += row["qty"]

        # Step 1: Fetch lookahead_days for the user
    user_row = (supabase.table("user")
                        .select("lookahead_days")
                        .eq("role_user_id", role_user_id)
                        .single()
                        .execute()).data

    lookahead_days = user_row.get("lookahead_days", 7)  # default to 7 if missing or null

    # Step 2: Forecast info using user-defined lookahead
    today = date.today().isoformat()
    future = (date.today() + timedelta(days=lookahead_days)).isoformat()

    forecast_rows = (supabase.table("forecast_daily")
                             .select("forecast_qty")
                             .eq("store_id", str(store_id))
                             .gte("forecast_date", today)
                             .lte("forecast_date", future)
                             .execute()).data or []

    total_forecast_units = sum(
        row["forecast_qty"] for row in forecast_rows if row.get("forecast_qty") is not None
    )

    # Alerts count
    alerts_rows = (supabase.table("alert")
                            .select("id")
                            .eq("store_id", str(store_id))
                            .execute()).data or []

    alert_count = len(alerts_rows)

    return jsonify({
        "distinct_skus": len(distinct_skus),
        "inventory_units": total_inventory_units,
        "forecast_units": total_forecast_units,
        "alerts": alert_count
    }), 200

@bp.route("/stores/with-alert-status", methods=["GET"])
@role_required
def stores_with_alert_status():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    today = date.today()
    all_store_alerts = []

    stores = Store.query.all()
    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    lookahead_days = user.lookahead_days if user and user.lookahead_days else 7

    for store in stores:
        store_id = store.store_id

        # --- Load inventory ---
        inv_rows = InventorySnapshot.query.filter_by(store_id=store_id).all()
        inv_map = {(row.store_id, row.sku): row.qty for row in inv_rows}

        # --- Load reorder_point ---
        reorder_point_rows = ReorderConfig.query.filter_by(store_id=store_id).all()
        reorder_point_map = {(row.store_id, row.sku): row.reorder_point for row in reorder_point_rows}

        # --- Load Reorder Configs for Lead Times ---
        reorder_rows = ReorderConfig.query.filter_by(store_id=store_id).all()
        lead_time_map = {(row.store_id, row.sku): row.lead_time_days for row in reorder_rows}

        # --- Load Forecast ---
        forecast_rows = ForecastDaily.query.filter_by(store_id=store_id).all()
        forecast_map = {}
        for row in forecast_rows:
            key = (row.store_id, row.sku)
            forecast_day = row.forecast_date
            if key not in forecast_map:
                forecast_map[key] = {}
            forecast_map[key][forecast_day] = row.forecast_qty

        # --- Alert logic ---
        skus_to_reorder = set()
        stockout_despite_reorder = set()

        for (s_id, sku), qty in inv_map.items():
            if s_id != store_id:
                continue

            reorder_point = reorder_point_map.get((s_id, sku))
            if reorder_point is None:
                continue

            if qty < reorder_point:
                skus_to_reorder.add(sku)

            lead_time = lead_time_map.get((s_id, sku), 0)
            projected_qty = float(qty) + max(float(reorder_point) - float(qty), 0)

            forecasts = forecast_map.get((s_id, sku), {})
            total_demand = 0.0

            for d in range(lookahead_days):
                forecast_day = today + timedelta(days=d)
                total_demand += forecasts.get(forecast_day, 0.0)

            if projected_qty < total_demand:
                stockout_despite_reorder.add(sku)

        all_store_alerts.append({
            "store_id": store_id,
            "num_skus_to_reorder": len(skus_to_reorder),
            "num_skus_stockout_despite_reorder": len(stockout_despite_reorder),
            "alert": len(skus_to_reorder) > 0 or len(stockout_despite_reorder) > 0
        })

    return jsonify(all_store_alerts)


@bp.route("/store/<int:store_id>/with-alert-status", methods=["GET"])
@role_required
def store_with_alert_status(store_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    today = date.today()

    user = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    lookahead_days = user.lookahead_days if user and user.lookahead_days else 7

    store = Store.query.filter_by(store_id=store_id).first()
    if not store:
        return jsonify({"error": "Store not found"}), 404

    # --- Load inventory ---
    inv_rows = InventorySnapshot.query.filter_by(store_id=store_id).all()
    inv_map = {(row.store_id, row.sku): row.qty for row in inv_rows}

    # --- Load reorder_point ---
    reorder_point_rows = ReorderConfig.query.filter_by(store_id=store_id).all()
    reorder_point_map = {(row.store_id, row.sku): row.reorder_point for row in reorder_point_rows}

    # --- Load lead time ---
    lead_time_map = {(row.store_id, row.sku): row.lead_time_days for row in reorder_point_rows}

    # --- Load forecast ---
    forecast_rows = ForecastDaily.query.filter_by(store_id=store_id).all()
    forecast_map = {}
    for row in forecast_rows:
        key = (row.store_id, row.sku)
        if key not in forecast_map:
            forecast_map[key] = {}
        forecast_map[key][row.forecast_date] = row.forecast_qty

    # --- Alert logic ---
    skus_to_reorder = set()
    stockout_despite_reorder = set()

    for (s_id, sku), qty in inv_map.items():
        reorder_point = reorder_point_map.get((s_id, sku))
        if reorder_point is None:
            continue

        if qty < reorder_point:
            skus_to_reorder.add(sku)

        lead_time = lead_time_map.get((s_id, sku), 0)
        projected_qty = float(qty) + max(float(reorder_point) - float(qty), 0)

        forecasts = forecast_map.get((s_id, sku), {})
        total_demand = sum(forecasts.get(today + timedelta(days=d), 0.0) for d in range(lookahead_days))

        if projected_qty < total_demand:
            stockout_despite_reorder.add(sku)

    return jsonify({
        "store_id": store_id,
        "num_skus_to_reorder": len(skus_to_reorder),
        "num_skus_stockout_despite_reorder": len(stockout_despite_reorder),
        "alert": len(skus_to_reorder) > 0 or len(stockout_despite_reorder) > 0
    })
