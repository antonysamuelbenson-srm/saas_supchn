from __future__ import annotations

from datetime import date, timedelta, datetime
import uuid
from statistics import mean, pstdev

from sqlalchemy import func

from app import db
from app.models.inventory import InventorySnapshot
from app.models.reorder_config import ReorderConfig
from app.models.forecast import ForecastDaily
from app.models.store import Store
from app.models.alert import Alert

# def generate_alerts(role_user_id):
#     alerts = []

#     # ✅ Get only inventory entries for this user
#     inventory = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()

#     # ✅ Get reorder configs for this user
#     reorder_map = {
#         r.sku: r.reorder_point
#         for r in ReorderConfig.query.filter_by(role_user_id=role_user_id).all()
#     }

#     for item in inventory:
#         if item.qty == 0:
#             alerts.append(Alert(
#                 id=str(uuid.uuid4()),
#                 role_user_id=role_user_id,
#                 sku=item.sku,
#                 store_id=item.store_id,
#                 message=f"Stockout: {item.sku} in {item.store_id}",
#                 type="Stockout",
#                 severity="Medium",
#                 created_at=datetime.utcnow()
#             ))
#         elif item.sku in reorder_map and item.qty < reorder_map[item.sku]:
#             alerts.append(Alert(
#                 id=str(uuid.uuid4()),
#                 role_user_id=role_user_id,
#                 sku=item.sku,
#                 store_id=item.store_id,
#                 message=f"Below threshold: {item.sku} in {item.store_id}",
#                 type="BelowThreshold",
#                 severity="Medium",
#                 created_at=datetime.utcnow()
#             ))

#     db.session.add_all(alerts)
#     db.session.commit()
#     return len(alerts)


EXCESS_MULTIPLE = 2     # qty > 2×ROP ⇒ excess
SPIKE_Z         = 2     # μ + 2σ threshold
LOOKAHEAD_DAYS  = 30    # horizon used for spike detection


# ────────────────────────────────────────────────────────────────
def _emit(alerts: dict, role_user_id: str, sku: str, store_id: int,
          msg: str, a_type: str, severity: str) -> None:
    """
    Helper to ensure a single open alert per (sku, store, type).
    """
    key = (sku, store_id, a_type)
    if key not in alerts:
        alerts[key] = Alert(
            id=str(uuid.uuid4()),
            role_user_id=role_user_id,
            sku=sku,
            store_id=store_id,
            message=msg,
            type=a_type,
            severity=severity,
            created_at=datetime.utcnow(),
        )


# ────────────────────────────────────────────────────────────────
def generate_alerts(role_user_id: str) -> int:
    """
    Re‑compute alerts for one tenant and return how many new alerts were created.
    Generates only:
        • STOCK_OUT
        • UNDER_STOCK  (below ROP)
        • EXCESS       (over capacity or > 2× ROP)
        • SPIKE        (forecast spike next 30 d)
    Existing alerts are **not** cleared here – that logic, if desired,
    should be handled separately (e.g. acknowledge / close alerts table).
    """
    today       = date.today()
    horizon_30  = today + timedelta(days=LOOKAHEAD_DAYS)

    # ── Pull current data ───────────────────────────────────────
    inv_rows = InventorySnapshot.query.filter_by(role_user_id=role_user_id).all()
    rop_rows = ReorderConfig.query.filter_by(role_user_id=role_user_id).all()
    fc_rows  = (ForecastDaily.query
                .filter(ForecastDaily.role_user_id == role_user_id,
                        ForecastDaily.forecast_date >= today,
                        ForecastDaily.forecast_date <= horizon_30)
                .all())
    stores   = Store.query.filter_by(role_user_id=role_user_id).all()

    inv_map = {(r.store_id, r.sku): float(r.qty) for r in inv_rows}

    # (store, sku) → (reorder_point, safety_stock)
    rop_map = {(r.store_id, r.sku): (float(r.reorder_point or 0.0),
                                     float(r.safety_stock  or 0.0))
               for r in rop_rows}

    capacity_map = {s.store_id: (float(s.capacity_units)
                                 if s.capacity_units is not None else None)
                    for s in stores}

    # {(store, sku): {date: forecast_qty}}
    fc_map: dict[tuple[int, str], dict[date, float]] = {}
    for r in fc_rows:
        key = (r.store_id, r.sku)
        fc_map.setdefault(key, {})[r.forecast_date] = float(r.forecast_qty)

    # ── Build alerts ────────────────────────────────────────────
    alerts: dict[tuple, Alert] = {}

    for (store_id, sku), qty in inv_map.items():
        rop, _ss = rop_map.get((store_id, sku), (0.0, 0.0))
        capacity = capacity_map.get(store_id)

        # 1️⃣  Out of stock
        if qty == 0:
            _emit(alerts, role_user_id, sku, store_id,
                  f"Out of stock: {sku} in store {store_id}",
                  "STOCK_OUT", "High")

        # 2️⃣  Under‑stock (below ROP)
        elif qty < rop:
            _emit(alerts, role_user_id, sku, store_id,
                  f"Under‑stock (qty {qty:.0f} < ROP {rop:.0f})",
                  "UNDER_STOCK", "Medium")

        # 3️⃣  Excess / over‑capacity
        upper = max(capacity if capacity else 0.0, rop * EXCESS_MULTIPLE)
        if upper and qty > upper:
            _emit(alerts, role_user_id, sku, store_id,
                  f"Excess stock: {qty:.0f} u vs limit {upper:.0f}",
                  "EXCESS", "Low")

        # 4️⃣  Forecast spike(s)
        fc_dict = fc_map.get((store_id, sku), {})
        if fc_dict:
            series = list(fc_dict.values())
            μ = mean(series)
            σ = pstdev(series) if len(series) > 1 else 0.0
            threshold = μ + SPIKE_Z * σ
            spike_days = [d for d, q in fc_dict.items() if q > threshold]
            if spike_days:
                first_day = min(spike_days)
                _emit(alerts, role_user_id, sku, store_id,
                      f"Forecast spike {fc_dict[first_day]:.0f} u on {first_day}",
                      "SPIKE", "Low")

    # ── Persist new alerts ───────────────────────────────────────
    if alerts:
        db.session.add_all(alerts.values())
        db.session.commit()
    return len(alerts)
