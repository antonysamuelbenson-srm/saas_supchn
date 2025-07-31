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


DATE_FMT = "%Y-%m-%d"

# ───────────────────────────────────────────────────────────── #
# 1. Filename → batch_type classifier
STORE_RE = re.compile(r"stores?_master", re.I)
INV_RE   = re.compile(r"inventory_snapshot", re.I)
FORE_RE  = re.compile(r"forecast_\d{4}-\d{2}", re.I)

def classify(filename: str) -> str | None:
    if STORE_RE.search(filename):
        return "store"
    if INV_RE.search(filename):
        return "inventory"
    if FORE_RE.search(filename):
        return "forecast"
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


# ───────────────────────────────────────────────────────────── #
# def insert_forecast_daily(
#     rows: List[Dict[str, Any]],
#     role_user_id: UUID,
#     batch_id: int,
#     store_cache: dict[str, int],
#     session: Session,
# ) -> None:
#     for row in rows:
#         store_code = row["store_code"]
#         store_id = store_cache.get(store_code)
#         if store_id is None:
#             raise ValueError(f"Unknown store_code in forecast CSV: {store_code}")
#         row["store_id"] = store_id

#     records = [
#         ForecastDaily(
#             forecast_date=row["forecast_date"],
#             store_id=row["store_id"],
#             sku=row["sku"],
#             forecast_qty=int(row["forecast_qty"]),
#             role_user_id=role_user_id,
#             batch_id=batch_id,
#         )
#         for row in rows
#     ]
#     session.add_all(records)

def insert_forecast_daily(rows, role_user_id, batch_id, store_cache, session):
    for row in rows:
        store_code = row["store_code"]
        store_id = store_cache.get(store_code)
        if store_id is None:
            raise ValueError(f"Unknown store_code in forecast CSV: {store_code}")
        row["store_id"] = store_id

    for row in rows:
        forecast = session.query(ForecastDaily).filter_by(
            forecast_date=row["forecast_date"],
            store_id=row["store_id"],
            sku=row["sku"]
        ).first()

        if forecast:
            forecast.forecast_qty = int(row["forecast_qty"])
            forecast.batch_id = batch_id
        else:
            forecast = ForecastDaily(
                forecast_date=row["forecast_date"],
                store_id=row["store_id"],
                sku=row["sku"],
                forecast_qty=int(row["forecast_qty"]),
                role_user_id=role_user_id,
                batch_id=batch_id,
            )
            session.add(forecast)



# def insert_transfer_cost_data(
#     rows: List[Dict[str, Any]],
#     role_user_id: UUID,
#     session: Session,
# ) -> None:
#     records = [
#         transferCostDta(
#             start_location=row["start_location"],
#             end_location=row["end_location"],
#             transfer_cost=float(row["transfer_cost"])
#         )
#         for row in rows
#     ]
#     session.add_all(records)

def insert_transfer_cost_data(rows, role_user_id, session):
    for row in rows:
        record = session.query(transferCostDta).filter_by(
            start_location=row["start_location"],
            end_location=row["end_location"]
        ).first()

        if record:
            record.transfer_cost = float(row["transfer_cost"])
        else:
            record = transferCostDta(
                start_location=row["start_location"],
                end_location=row["end_location"],
                transfer_cost=float(row["transfer_cost"])
            )
            session.add(record)



# def insert_total_store_data(
#     rows: List[Dict[str, Any]],
#     role_user_id: UUID,
#     session: Session,
# ) -> None:
#     records = [
#         totalStoreData(
#             node_name=row["node_name"],
#             sku=row["sku"],
#             safety_stock_level=int(row["safety_stock_level"]),
#             reorder_level=int(row["reorder_level"])
#         )
#         for row in rows
#     ]
#     session.add_all(records)

def insert_total_store_data(rows, role_user_id, session):
    for row in rows:
        record = session.query(totalStoreData).filter_by(
            node_name=row["node_name"],
            sku=row["sku"]
        ).first()

        if record:
            record.safety_stock_level = int(row["safety_stock_level"])
            record.reorder_level = int(row["reorder_level"])
        else:
            record = totalStoreData(
                node_name=row["node_name"],
                sku=row["sku"],
                safety_stock_level=int(row["safety_stock_level"]),
                reorder_level=int(row["reorder_level"])
            )
            session.add(record)



# def insert_warehouse_max_data(
#     rows: List[Dict[str, Any]],
#     role_user_id: UUID,
#     session: Session,
# ) -> None:
#     records = [
#         warehouse_Max_Data(
#             warehouse_name=row["warehouse_name"],
#             max_capacity=int(row["max_capacity"])
#         )
#         for row in rows
#     ]
#     session.add_all(records)

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

# ───────────────────────────────────────────────────────────── #
def ingest_csv_files(paths: List[Path], role_user_id: UUID, btype: str):
    with db.session() as session:
        store_cache = build_store_cache(session)

        for path in paths:
            batch_type = btype
            if batch_type is None:
                raise ValueError(f"Cannot classify CSV filename: {path.name}")

            rows = load_csv(path)
            if not rows:
                raise ValueError(f"{path.name} is empty")

            # Find min/max date
            date_cols = [c for c in rows[0] if c.endswith("_date")] if rows else []
            if date_cols:
                dates = [r[date_cols[0]] for r in rows if r.get(date_cols[0])]
                dmin = min(dates)
                dmax = max(dates)
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

            elif batch_type == "warehouse_max_data":
                insert_warehouse_max_data(rows, role_user_id, session)


        session.commit()
