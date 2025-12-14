from __future__ import annotations

import re
import csv
from datetime import datetime, date
from pathlib import Path
from typing import Sequence, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app import db
from app.models.store import Store
from app.models.inventory import InventorySnapshot
from app.models.forecast import ForecastDaily
from app.models.upload_batch import UploadBatch
from app.models.transfer_cost_data import transferCostDta
from app.models.store_total_data import totalStoreData
from app.models.warehouse_max_data import warehouse_Max_Data
from app.models.sales import Sales 
import logging
logger = logging.getLogger(__name__)


DATE_FMT = "%Y-%m-%d"

# ───────────────────────────────────────────────────────────── #
# 1. Filename → batch_type classifier
STORE_RE = re.compile(r"stores?_master", re.I)
INV_RE   = re.compile(r"inventory_snapshot", re.I)
FORE_RE  = re.compile(r"forecast_\d{4}-\d{2}", re.I)
TRANS_RE = re.compile(r"transfer_cost", re.I)
CAPA_RE  = re.compile(r"capacity", re.I)
SALES_RE = re.compile(r"sales_data", re.I)

# def classify(filename: str) -> str | None:
#     if STORE_RE.search(filename):
#         return "store"
#     if INV_RE.search(filename):
#         return "inventory"
#     if FORE_RE.search(filename):
#         return "forecast"
#     if TRANS_RE.search(filename):
#         return "transfer_cost_data"
#     if CAPA_RE.search(filename):
#         return "capacity"
#     return None

TOTAL_RE = re.compile(r"total_store_data", re.I)

def classify(filename: str) -> str | None:
    if STORE_RE.search(filename):
        return "store"
    if INV_RE.search(filename):
        return "inventory"
    if FORE_RE.search(filename):
        return "forecast"
    if TRANS_RE.search(filename):
        return "transfer_cost_data"
    if TOTAL_RE.search(filename):
        return "total_store_data"
    if CAPA_RE.search(filename):
        return "capacity"
    if SALES_RE.search(filename):
        return "sales"
    return None

# ───────────────────────────────────────────────────────────── #
# 2. CSV reader (no pandas)
def load_csv(path: Path) -> List[Dict[str, Any]]:
    with path.open(newline="", encoding="utf-8") as fp:
        reader = csv.DictReader(fp)
        rows: List[Dict[str, Any]] = []
        for row in reader:
            clean = {}
            for k, v in row.items():
                v = v.strip() if isinstance(v, str) else v
                if k.endswith("_date") and v:
                    clean[k] = datetime.strptime(v, DATE_FMT).date()
                elif v == "":
                    clean[k] = None
                else:
                    clean[k] = v
            rows.append(clean)
    return rows

# ───────────────────────────────────────────────────────────── #
def upsert_store_csv(rows: List[Dict[str, Any]], role_user_id: UUID, session: Session) -> None:
    for row in rows:
        store = (
            session.query(Store)
            .filter_by(store_code=row["store_code"])
            .one_or_none()
        )

        if store:
            # Update existing store
            store.name = row.get("name")
            store.address = row.get("address")
            store.city = row.get("city")
            store.state = row.get("state")
            store.country = row.get("country")
            store.lat = float(row["lat"]) if row.get("lat") else None
            store.long = float(row["long"]) if row.get("long") else None
            store.capacity_units = float(row["capacity_units"]) if row.get("capacity_units") else None
        else:
            # Insert new store
            new_store = Store(
                role_user_id=role_user_id,
                store_code=row["store_code"],
                name=row.get("name"),
                address=row.get("address"),
                city=row.get("city"),
                state=row.get("state"),
                country=row.get("country"),
                lat=float(row["lat"]) if row.get("lat") else None,
                long=float(row["long"]) if row.get("long") else None,
                capacity_units=float(row["capacity_units"]) if row.get("capacity_units") else None,
            )
            session.add(new_store)


# ───────────────────────────────────────────────────────────── #
def build_store_cache(session: Session) -> dict[str, int]:
    stores = (
        session.query(Store.store_code, Store.store_id)
        .all()
    )
    return {store_code: store_id for store_code, store_id in stores}

# ───────────────────────────────────────────────────────────── #
def insert_inventory_snapshot(
    rows: List[Dict[str, Any]],
    role_user_id: UUID,
    store_cache: dict[str, int],
    session: Session,
) -> None:
    for row in rows:
        store_code = row["store_code"]
        store_id = store_cache.get(store_code)
        if store_id is None:
            raise ValueError(f"Unknown store_code in inventory CSV: {store_code}")
        row["store_id"] = store_id

    records = [
        InventorySnapshot(
            snapshot_date=row["snapshot_date"],
            store_id=row["store_id"],
            sku=row["sku"],
            qty=int(row["qty"]),
            product_name=(row["product_name"]),
            role_user_id=role_user_id,
        )
        for row in rows
    ]
    session.add_all(records)


from typing import List, Dict, Any
from uuid import UUID

def insert_forecast_daily(rows: List[Dict[str, Any]], role_user_id: UUID, batch_id: int, store_cache: dict[str, int], session):
    """
    Bulk UPSERT (update or insert) for ForecastDaily data.
    Follows the same style as insert_sales_data: fetch existing rows in bulk,
    then perform bulk_update_mappings and bulk_insert_mappings.
    """
    # Map store codes to store IDs
    for row in rows:
        store_code = row["store_code"]
        store_id = store_cache.get(store_code)
        if store_id is None:
            raise ValueError(f"Unknown store_code in forecast CSV: {store_code}")
        row["store_id"] = store_id

    # Identify unique keys (forecast_date, store_id, sku)
    unique_keys = {(row["forecast_date"], row["store_id"], row["sku"]) for row in rows}
    if not unique_keys:
        return

    dates = {k[0] for k in unique_keys}
    store_ids = {k[1] for k in unique_keys}
    skus = {k[2] for k in unique_keys}

    # Fetch existing forecasts in bulk
    existing_forecasts = session.query(ForecastDaily).filter(
        ForecastDaily.forecast_date.in_(dates),
        ForecastDaily.store_id.in_(store_ids),
        ForecastDaily.sku.in_(skus)
    ).all()

    existing_map = {
        (f.forecast_date, f.store_id, f.sku): f
        for f in existing_forecasts
    }

    records_to_update = []
    records_to_insert = []

    for row in rows:
        key = (row["forecast_date"], row["store_id"], row["sku"])
        forecast_qty = int(row["forecast_qty"])
        existing_forecast = existing_map.get(key)

        if existing_forecast:
            if existing_forecast.forecast_qty != forecast_qty or existing_forecast.batch_id != batch_id:
                records_to_update.append({
                    "forecast_id": existing_forecast.forecast_id,
                    "forecast_qty": forecast_qty,
                    "batch_id": batch_id
                })
        else:
            records_to_insert.append({
                "forecast_date": row["forecast_date"],
                "store_id": row["store_id"],
                "sku": row["sku"],
                "forecast_qty": forecast_qty,
                "role_user_id": role_user_id,
                "batch_id": batch_id
            })

    # Bulk update existing forecasts
    if records_to_update:
        session.bulk_update_mappings(ForecastDaily, records_to_update)
        print(f"Updated {len(records_to_update)} ForecastDaily records.")

    # Bulk insert new forecasts
    if records_to_insert:
        session.bulk_insert_mappings(ForecastDaily, records_to_insert)
        print(f"Inserted {len(records_to_insert)} new ForecastDaily records.")


def insert_transfer_cost_data(rows, role_user_id, session):
    for row in rows:
        record = session.query(transferCostDta).filter_by(
            start_location=row["start_location"],
            end_location=row["end_location"]
        ).first()

        if record:
            record.transfer_cost = float(row["transfer_cost"])
            record.lead_time = int(row["lead_time"])   # new column
        else:
            record = transferCostDta(
                start_location=row["start_location"],
                end_location=row["end_location"],
                transfer_cost=float(row["transfer_cost"]),
                lead_time=int(row["lead_time"])        # new column
            )
            session.add(record)

    session.commit()



def insert_total_store_data(rows, role_user_id, session):
    for row in rows:
        record = session.query(totalStoreData).filter_by(
            store_code=row["store_code"],
            sku=row["sku"]
        ).first()

        if record:
            record.safety_stock_level = int(row["safety_stock_level"])
            record.reorder_level = int(row["reorder_level"])
        else:
            record = totalStoreData(
                store_code=row["store_code"],
                sku=row["sku"],
                safety_stock_level=int(row["safety_stock_level"]),
                reorder_level=int(row["reorder_level"])
            )
            session.add(record)

def insert_warehouse_max_data(rows, role_user_id, session):
    for row in rows:
        record = session.query(warehouse_Max_Data).filter_by(
            warehouse_name=row["warehouse_name"]
        ).first()

        if record:
            record.max_capacity = int(row["max_capacity"])
        else:
            record = warehouse_Max_Data(
                warehouse_name=row["warehouse_name"],
                max_capacity=int(row["max_capacity"]),
                store_id=row.get("store_id")  # make sure this exists in the data
            )
            session.add(record)


def insert_sales_data(rows: List[Dict[str, Any]], role_user_id: UUID, store_cache: dict[str, int], session: Session):
    """
    Optimized function to perform bulk UPSERT (Update or Insert) for Sales data.
    
    It replaces the slow row-by-row existence check with a single bulk query
    followed by bulk update/insert mappings.
    """
    for row in rows:
        store_code = row["store_id"] 
        if store_code not in store_cache:
            raise ValueError(f"Unknown store_id (store_code) in sales CSV: {store_code}")

    unique_keys = set()
    for row in rows:
        key = (row["date"], row["store_id"], row["sku"])
        unique_keys.add(key)
    
    if not unique_keys:
        return 
    
    dates = {k[0] for k in unique_keys}
    store_ids = {k[1] for k in unique_keys}
    skus = {k[2] for k in unique_keys}

    existing_sales = session.query(Sales).filter(
        Sales.date.in_(dates),
        Sales.store_id.in_(store_ids),
        Sales.sku.in_(skus)
    ).all()
    
    existing_map = {}
    for sale in existing_sales:
        key = (sale.date, sale.store_id, sale.sku)
        existing_map[key] = sale
    
    records_to_update = []
    records_to_insert = []
    
    for row in rows:
        key = (row["date"], row["store_id"], row["sku"])
        units_sold = int(row["units_sold"])
        
        existing_sale = existing_map.get(key)
        
        if existing_sale:
            if existing_sale.units_sold != units_sold:
                records_to_update.append({
                    "id": existing_sale.id, 
                    "units_sold": units_sold
                })
        else:
            records_to_insert.append({
                "date": row["date"],
                "sku": row["sku"],
                "store_id": row["store_id"], 
                "units_sold": units_sold,
            })
    
 
    if records_to_update:
        session.bulk_update_mappings(Sales, records_to_update)
        logger.info(f"Updated {len(records_to_update)} Sales records.")
    
    if records_to_insert:
        session.bulk_insert_mappings(Sales, records_to_insert)
        logger.info(f"Inserted {len(records_to_insert)} new Sales records.")
        

# ───────────────────────────────────────────────────────────── #
def register_batch(
    session: Session,
    role_user_id: UUID,
    batch_type: str,
    filename: str,
    date_min,
    date_max,
) -> int:
    batch = UploadBatch(
        role_user_id=role_user_id,
        batch_type=batch_type,
        original_filename=filename,
        effective_start_date=date_min,
        effective_end_date=date_max,
    )
    session.add(batch)
    session.flush()
    return batch.batch_id

import io
import pandas as pd
from sqlalchemy import text

def bulk_upload_inventory_csv(file_path: Path, role_user_id: UUID) -> None:
    """
    Simple bulk insert without touching triggers
    """
    # Read the CSV
    df = pd.read_csv(file_path)
    logger.info(f"📊 Read {len(df)} records from {file_path}")
    
    # Get store mapping
    store_mapping = _get_store_mapping()
    
    # Map store_code to store_id and validate
    if 'store_code' in df.columns:
        df['store_id'] = df['store_code'].map(store_mapping)
        unknown_stores = df[df['store_id'].isna()]['store_code'].unique()
        if len(unknown_stores) > 0:
            raise ValueError(f"Unknown store_code(s) in inventory CSV: {list(unknown_stores)}")
    
    # Convert to list of dictionaries
    records = []
    for _, row in df.iterrows():
        records.append({
            "snapshot_date": row["snapshot_date"],
            "store_id": row["store_id"],
            "sku": row["sku"],
            "qty": int(row["qty"]),
            "product_name": row["product_name"],
            "role_user_id": role_user_id,
        })
    
    from app.models.inventory import InventorySnapshot
    
    try:
        # Just do the bulk insert without touching triggers
        # This is still much faster than individual inserts
        db.session.bulk_insert_mappings(InventorySnapshot, records)
        db.session.commit()
        
        logger.info(f"✅ Successfully uploaded {len(records)} records via bulk insert")
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"❌ Bulk insert failed: {e}")
        raise
    
    # Manual recalculation might not be needed since trigger will handle it
    # But we'll keep it to ensure data consistency
    logger.info("🔄 Ensuring inventory data is recalculated...")
    try:
        db.session.execute(text("SELECT recalculate_store_inventory();"))
        db.session.commit()
        logger.info("✅ Inventory recalculation completed")
    except Exception as e:
        logger.error(f"⚠️  Inventory recalculation failed (might be OK): {e}")
        db.session.rollback()  # Don't fail the whole upload for this


def _get_store_mapping():
    """Get mapping from store_code to store_id"""
    result = db.session.execute(text("SELECT store_id, store_code FROM store_data"))
    return {row.store_code: row.store_id for row in result}



def ingest_csv_files(paths: List[Path], role_user_id: UUID, btype: str = None):
    with db.session() as session:
        store_cache = build_store_cache(session)

        for path in paths:
            batch_type = btype or classify(path.name)
            if batch_type is None:
                raise ValueError(f"Cannot classify CSV filename: {path.name}")

            rows = load_csv(path)
            if not rows:
                raise ValueError(f"{path.name} is empty")

            # Find min/max date
            date_cols = [c for c in rows[0] if c.endswith("_date")] if rows else []
            if date_cols:
                dates = [r[date_cols[0]] for r in rows if r.get(date_cols[0])]
                dmin = min(dates) if dates else None
                dmax = max(dates) if dates else None
            else:
                dmin = dmax = None

            batch_id = register_batch(
                session,
                role_user_id=role_user_id,
                batch_type=batch_type,
                filename=path.name,
                date_min=dmin,
                date_max=dmax,
            )

            if batch_type == "store":
                upsert_store_csv(rows, role_user_id, session)
                store_cache = build_store_cache(session)

            elif batch_type == "inventory":
                insert_inventory_snapshot(rows, role_user_id, store_cache, session)

            elif batch_type == "forecast":
                insert_forecast_daily(rows, role_user_id, batch_id, store_cache, session)

            elif batch_type == "transfer_cost_data":
                insert_transfer_cost_data(rows, role_user_id, session)
            
            elif batch_type == "total_store_data":
                insert_total_store_data(rows, role_user_id, session)

            elif batch_type == "capacity":
                insert_warehouse_max_data(rows, role_user_id, session)
            elif batch_type == "sales":
                insert_sales_data(rows, role_user_id, store_cache, session)

            else:
                raise ValueError(f"Unsupported batch type: {batch_type}")

        session.commit()
