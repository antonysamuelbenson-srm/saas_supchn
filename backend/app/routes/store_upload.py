# app/routes/store.py

from flask import Blueprint, request, jsonify
from datetime import date, timedelta
from collections import Counter
from dotenv import load_dotenv
import os

from app.utils.jwt_utils import decode_jwt
from app.utils.decorators import role_required
from app.utils.supabase_adapter import supabase  # ✅ custom supabase adapter
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
from app.models.predict import Forecast
from app.models.user import User
from app.models.store import Store
from app.models.reorder_config import ReorderConfig
from app import db

load_dotenv()

bp = Blueprint("store", __name__)

# ────────────────────────────────────────────────────────────────
# 1️⃣ POST /store_upload  – add one store row
# ────────────────────────────────────────────────────────────────
@bp.route("/store_upload", methods=["POST"])
@role_required
def store_upload():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    needed = ("store_code", "name", "address", "city")
    missing = [k for k in needed if not data.get(k)]
    if missing:
        return jsonify({"error": f"Missing field(s): {', '.join(missing)}"}), 400

    store_code = data["store_code"].strip()

    # Check duplicate
    try:
        dup = (
            supabase.table("store_data")
            .select("store_id")
            .eq("store_code", store_code)
            .maybe_single()
            .execute()
        )
        if dup and dup.data:
            return jsonify({"message": "⚠️ Store already exists", "store_id": dup.data["store_id"]}), 200
    except Exception as e:
        return jsonify({"error": f"Lookup failed: {str(e)}"}), 500

    def to_float(x):
        try:
            return float(x)
        except (TypeError, ValueError):
            return None

    row = {
        "role_user_id": role_user_id,
        "store_code": store_code,
        "name": data["name"].strip(),
        "address": data["address"].strip(),
        "city": data["city"].strip(),
        "state": data.get("state"),
        "country": data.get("country"),
        "lat": to_float(data.get("lat")),
        "long": to_float(data.get("long")),
        "capacity_units": to_float(data.get("capacity_units")),
    }

    try:
        res = supabase.table("store_data").insert(row).execute()
        if not res or not res.data:
            return jsonify({"error": "Insert failed"}), 400
        return jsonify({"message": "✅ Store added", "store": res.data[0]}), 201
    except Exception as e:
        return jsonify({"error": f"Insertion error: {str(e)}"}), 500


# ────────────────────────────────────────────────────────────────
# 2️⃣ GET /stores  – store summary map
# ────────────────────────────────────────────────────────────────
@bp.route("/stores", methods=["GET"])
@role_required
def all_stores():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    if not payload.get("role_user_id"):
        return jsonify({"error": "Unauthorized"}), 401

    stores = (supabase.table("store_data").select("*").execute()).data or []
    alert_rows = (supabase.table("alert").select("store_id").execute()).data or []
    alert_map = dict(Counter(int(r["store_id"]) for r in alert_rows if r.get("store_id") is not None))

    inv_rows = (supabase.table("inventory").select("store_id,sku,snapshot_date").execute()).data or []
    inv_map = {}
    for row in inv_rows:
        sid = int(row["store_id"])
        if sid not in inv_map:
            inv_map[sid] = {"sku_set": set(), "last_update": row.get("snapshot_date")}
        inv_map[sid]["sku_set"].add(row["sku"])
        if row.get("snapshot_date"):
            prev = inv_map[sid]["last_update"]
            inv_map[sid]["last_update"] = max(prev, row["snapshot_date"])

    for sid, v in inv_map.items():
        v["sku_total"] = len(v["sku_set"])

    out = []
    for s in stores:
        stats = inv_map.get(int(s["store_id"]), {})
        out.append({
            "store_id": s["store_id"],
            "name": s["name"],
            "city": s["city"],
            "lat": float(s["lat"]) if s["lat"] else None,
            "lon": float(s["long"]) if s["long"] else None,
            "sku_total": stats.get("sku_total", 0),
            "alert_total": alert_map.get(s["store_id"], 0),
            "last_update": stats.get("last_update"),
        })
    return jsonify({"stores": out}), 200


# ────────────────────────────────────────────────────────────────
# 3️⃣ GET /store/<id>/summary
# ────────────────────────────────────────────────────────────────
@bp.route("/store/<int:store_id>/summary", methods=["GET"])
@role_required
def single_store_summary(store_id: int):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    if not payload.get("role_user_id"):
        return jsonify({"error": "Unauthorized"}), 401

    store_res = supabase.table("store_data").select("*").eq("store_id", store_id).maybe_single().execute()
    if not store_res.data:
        return jsonify({"error": "Store not found"}), 404
    store = store_res.data

    inv = supabase.table("inventory").select("*").eq("store_id", store_id).execute().data or []
    rc_rows = supabase.table("reorder_config").select("*").eq("store_id", store_id).execute().data or []
    alerts = (
        supabase.table("alert")
        .select("*")
        .eq("store_id", store_id)
        .order("created_at", desc=True)
        .execute()
        .data or []
    )

    rc_map = {r["sku"]: r for r in rc_rows}
    alert_out = {}
    for a in alerts:
        t = a["type"].lower()
        bucket = alert_out.setdefault(t, {"count": 0, "items": []})
        bucket["items"].append({
            "sku": a["sku"],
            "message": a["message"],
            "severity": a["severity"],
            "at": a["created_at"],
        })
        bucket["count"] += 1

    items_out = []
    for row in inv:
        sku = row["sku"]
        rc = rc_map.get(sku, {})
        items_out.append({
            "sku": sku,
            "quantity": row["qty"],
            "avg_daily_usage": rc.get("avg_daily_usage"),
            "lead_time_days": rc.get("lead_time_days"),
            "safety_stock": rc.get("safety_stock"),
            "reorder_point": rc.get("reorder_point"),
        })

    store_key = f"{store['name']} | {store['city']}"
    return jsonify({store_key: {"alerts": alert_out, "items": items_out}}), 200


# ────────────────────────────────────────────────────────────────
# 4️⃣ GET /store/<id>/hover
# ────────────────────────────────────────────────────────────────
@bp.route("/store/<int:store_id>/hover", methods=["GET"])
def hovered_store_stats(store_id):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")
    if not role_user_id:
        return jsonify({"error": "Unauthorized"}), 401

    latest_snapshot = (
        supabase.table("inventory")
        .select("snapshot_date")
        .eq("store_id", str(store_id))
        .order("snapshot_date", desc=True)
        .limit(1)
        .execute()
    ).data

    inv_rows = []
    if latest_snapshot:
        latest_date = latest_snapshot[0]["snapshot_date"]
        inv_rows = (
            supabase.table("inventory")
            .select("sku,qty")
            .eq("store_id", str(store_id))
            .eq("snapshot_date", latest_date)
            .execute()
        ).data or []

    distinct_skus = {r["sku"] for r in inv_rows if r.get("sku")}
    total_inventory_units = sum(r["qty"] for r in inv_rows if r.get("qty") is not None)

    user_row = db.session.query(User).filter_by(role_user_id=role_user_id).first()
    lookahead_days = user_row.lookahead_days if user_row and user_row.lookahead_days else 7

    store_code = db.session.query(Store.store_code).filter(Store.store_id == store_id).scalar()
    if not store_code:
        return jsonify({"error": "Store not found"}), 404

    today = date.today()
    future = today + timedelta(days=lookahead_days)
    forecast_rows = (
        db.session.query(Forecast)
        .filter(Forecast.store_id == store_code)
        .filter(Forecast.date >= today)
        .filter(Forecast.date <= future)
        .all()
    )

    total_forecast_units = sum(f.predicted for f in forecast_rows if f.predicted is not None)

    alerts_rows = supabase.table("alert").select("id").eq("store_id", str(store_id)).execute().data or []
    alert_count = len(alerts_rows)

    return jsonify({
        "distinct_skus": len(distinct_skus),
        "inventory_units": int(round(total_inventory_units)),
        "forecast_units": int(round(total_forecast_units)),
        "alerts": alert_count
    }), 200


    # ────────────────────────────────────────────────────────────────
# 5️⃣ GET /store/<id>/with-alert-status (Missing Endpoint)
# ────────────────────────────────────────────────────────────────
@bp.route("/store/<int:store_id>/with-alert-status", methods=["GET"])
@role_required
def get_store_alert_status_route(store_id):
    """
    Returns alert statistics for a specific store.
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    if not payload.get("role_user_id"):
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch alerts for this store from the DB
    alerts = (
        supabase.table("alert")
        .select("type")
        .eq("store_id", str(store_id))
        .execute()
        .data or []
    )

    # Count specific alert types
    reorders = sum(1 for a in alerts if a["type"] == "Reorder Needed")
    stockouts = sum(1 for a in alerts if a["type"] == "Stockout Despite Reorder")
    
    # "alert" is true if there are ANY alerts
    has_alert = len(alerts) > 0

    return jsonify({
        "store_id": store_id,
        "num_skus_to_reorder": reorders,
        "num_skus_stockout_despite_reorder": stockouts,
        "alert": has_alert
    }), 200


# ────────────────────────────────────────────────────────────────
# 6️⃣ GET /stores/with-alert-status (Missing Endpoint for Map)
# ────────────────────────────────────────────────────────────────
@bp.route("/stores/with-alert-status", methods=["GET"])
@role_required
def get_all_stores_alert_status():
    """
    Returns alert statistics for ALL stores.
    """
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    if not payload.get("role_user_id"):
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch all active alerts
    all_alerts = (
        supabase.table("alert")
        .select("store_id, type")
        .execute()
        .data or []
    )

    # Aggregate by store
    store_stats = {}
    
    for a in all_alerts:
        sid = int(a["store_id"])
        if sid not in store_stats:
            store_stats[sid] = {"reorders": 0, "stockouts": 0}
        
        if a["type"] == "Reorder Needed":
            store_stats[sid]["reorders"] += 1
        elif a["type"] == "Stockout Despite Reorder":
            store_stats[sid]["stockouts"] += 1

    # Format result list
    results = []
    # We need a list of all stores to ensure we return 0s for stores with no alerts
    all_stores_rows = supabase.table("store_data").select("store_id").execute().data or []
    
    for s in all_stores_rows:
        sid = int(s["store_id"])
        stats = store_stats.get(sid, {"reorders": 0, "stockouts": 0})
        
        results.append({
            "store_id": sid,
            "num_skus_to_reorder": stats["reorders"],
            "num_skus_stockout_despite_reorder": stats["stockouts"],
            "alert": (stats["reorders"] > 0 or stats["stockouts"] > 0)
        })

    return jsonify(results), 200