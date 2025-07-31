from __future__ import annotations
import uuid, tempfile
from pathlib import Path
from typing import List
import pandas as pd
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app import db
from app.models.store import Store
from app.services.ingest_csvs import ingest_csv_files
from app.utils.jwt_utils import decode_jwt
from app.utils.threshold_calc import update_reorder_config 
from app.utils.decorators import role_required


bp = Blueprint("upload", __name__, url_prefix="/api/upload")

REQUIRED_COLS = {
    "store": [
        "store_code", "name", "address", "city", "state",
        "country", "lat", "long", "capacity_units",
    ],
    "inventory": ["snapshot_date", "store_code", "sku", "qty", "product_name"],
    "forecast":  ["forecast_date", "store_code", "sku", "forecast_qty"],
    "total_store_data": ["node_name", "sku", "safety_stock_level", "reorder_level"],
    "transfer_cost_data": ["start_location", "end_location", "transfer_cost"],
    "warehouse_max_data": ["store_id", "warehouse_name", "max_capacity"]
}

# ─────────────────────── helpers ───────────────────────────────────────
def _fetch_store_codes() -> set[str]:
    rows = db.session.query(Store.store_code).all()
    return {r.store_code for r in rows}

def _validate_csv(df: pd.DataFrame, btype: str, role_user_id: uuid.UUID) -> List[str]:
    errors: list[str] = []
    missing = [c for c in REQUIRED_COLS[btype] if c not in df.columns]
    if missing:
        errors.append(f"missing column(s): {', '.join(missing)}")
    if df.isnull().values.any():
        errors.append("contains blank / NaN values")
    if not errors and btype in ("inventory", "forecast"):
        unknown = set(df["store_code"].unique()) - _fetch_store_codes()
        if unknown:
            errors.append(f"unknown store_code(s): {', '.join(unknown)}")
    return errors

def _handle_upload(btype: str):
    # ---- auth ---------------------------------------------------------
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    if not payload or "role_user_id" not in payload:
        return jsonify({"error": "Unauthorized"}), 401
    role_user_id = uuid.UUID(payload["role_user_id"])

    # ---- file checks --------------------------------------------------
    if "file" not in request.files:
        return jsonify({"error": "No file part in form‑data"}), 400
    f = request.files["file"]

    try:
        df = pd.read_csv(f)
        f.seek(0)
    except Exception as e:
        return jsonify({"error": f"Could not parse CSV ({e})"}), 400

    errs = _validate_csv(df, btype, role_user_id)
    if errs:
        return jsonify({"valid": False, "errors": errs}), 400

    # ---- save + ingest ------------------------------------------------
    filename = secure_filename(f.filename) or "upload.csv"
    f.seek(0)
    with tempfile.NamedTemporaryFile(suffix=f"_{filename}", delete=False) as tmp:
        tmp.write(f.read())
        tmp_path = Path(tmp.name)


    try:
        ingest_csv_files([tmp_path], role_user_id,btype)
        update_reorder_config(role_user_id, formula="default",store_ids=None)
    except Exception as exc:
        db.session.rollback()
        tmp_path.unlink(missing_ok=True)
        return jsonify({"error": str(exc)}), 400
    finally:
        tmp_path.unlink(missing_ok=True)

    return jsonify({"status": "success"}), 201

# ─────────────────────── routes ────────────────────────────────────────
@bp.post("/store")
@role_required
def upload_store():
    return _handle_upload("store")

@bp.post("/inventory")
@role_required
def upload_inventory():
    return _handle_upload("inventory")

@bp.post("/forecast")
@role_required
def upload_forecast():
    return _handle_upload("forecast")

@bp.post("/totalStoreData")
@role_required
def upload_totalStore_Data():
    return _handle_upload("total_store_data")

@bp.post("/transferCostData")
@role_required
def upload_transferCost_Data():
    return _handle_upload("transfer_cost_data")

@bp.post("/warehouseMaxData")
@role_required
def upload_warehouse_max_data():
    return _handle_upload("warehouse_max_data")

