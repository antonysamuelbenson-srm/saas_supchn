from datetime import date, timedelta
from sqlalchemy import func, select, union_all
from app import db
from app.models.inventory import InventorySnapshot
from app.models.predict import Forecast
from app.models.store import Store
from app.models.transfer_cost_data import transferCostDta
import pulp
import logging
import csv
from io import StringIO
from collections import defaultdict

logger = logging.getLogger(__name__)

# --- Helper to standardize keys ---
def _normalize_key(key_part):
    """Converts a key part to a standard format (lowercase, stripped)."""
    return str(key_part).lower().strip() if key_part else None

def compute_shortages_excesses(ddos_days: int):
    """
    Computes inventory shortages and excesses using a robust query
    that includes items with forecasts but no inventory.
    """
    today = date.today()
    future = today + timedelta(days=ddos_days)

    # Step 1: Create a subquery for all unique store/SKU combinations
    inv_keys = select(InventorySnapshot.store_id, InventorySnapshot.sku).distinct()
    fc_keys = select(Store.store_id, Forecast.product_id.label("sku")).join(Store, Store.store_code == Forecast.store_id).distinct()
    all_keys_stmt = union_all(inv_keys, fc_keys).alias("all_keys")
    UniqueKeys = select(all_keys_stmt.c.store_id, all_keys_stmt.c.sku).distinct().cte("unique_keys")

    # Step 2: Create subqueries for aggregated inventory and forecast data.
    InvTotals = (
        select(
            InventorySnapshot.store_id,
            InventorySnapshot.sku,
            func.sum(InventorySnapshot.qty).label("total_inventory"),
        )
        .group_by(InventorySnapshot.store_id, InventorySnapshot.sku)
        .cte("inv_totals")
    )

    FcTotals = (
        select(
            Forecast.store_id,
            Forecast.product_id.label("sku"),
            func.sum(Forecast.predicted).label("total_forecast"),
        )
        .where((Forecast.date >= today) & (Forecast.date < future))
        .group_by(Forecast.store_id, Forecast.product_id)
        .cte("fc_totals")
    )
    
    # Step 3: Join everything together starting from the complete set of keys.
    query = (
        select(
            Store.store_code,
            UniqueKeys.c.sku,
            func.coalesce(InvTotals.c.total_inventory, 0).label("inventory"),
            func.coalesce(FcTotals.c.total_forecast, 0).label("forecast_units"),
        )
        .select_from(UniqueKeys)
        .join(Store, Store.store_id == UniqueKeys.c.store_id)
        .outerjoin(InvTotals, (UniqueKeys.c.store_id == InvTotals.c.store_id) & (UniqueKeys.c.sku == InvTotals.c.sku))
        .outerjoin(FcTotals, (Store.store_code == FcTotals.c.store_id) & (UniqueKeys.c.sku == FcTotals.c.sku))
    )

    rows = db.session.execute(query).all()

    results = []
    for r in rows:
        inv_qty = float(r.inventory or 0)
        tgt_qty = float(r.forecast_units or 0) # This is the demand
        diff = int(inv_qty - tgt_qty)
        short = -diff if diff < 0 else 0
        excess = diff if diff > 0 else 0

        if short > 0 or excess > 0:
            results.append({
                "store": r.store_code, "sku": r.sku,
                "inventory": int(inv_qty), "target": int(tgt_qty),
                "forecast": int(tgt_qty), "shortage": short, "excess": excess,
            })
            # Added detailed print statement for debugging
            print(f"[DEBUG] Store={r.store_code} SKU={r.sku} Inv={int(inv_qty)} Target={int(tgt_qty)} Short={short} Excess={excess}")
            
    return results

def get_transfer_costs():
    """Loads transfer costs and lead times from the database."""
    costs = {}
    try:
        rows = db.session.query(transferCostDta).all()
        for row in rows:
            src, dst = row.start_location, row.end_location
            if src not in costs: costs[src] = {}
            costs[src][dst] = {"cost": row.transfer_cost, "lead_time": row.lead_time}
    except Exception as e:
        logger.error(f"Failed to load transfer costs: {e}")
        return None
    return costs

def convert_to_csv(data):
    """Converts a list of dictionaries to a CSV formatted string."""
    if not data: return ""
    
    output = StringIO()
    fieldnames = [
        "Source",
        "Destination",
        "SKU",
        "Units",
        "Source Inventory",
        "Destination Inventory",
        "Source DOS",
        "Destination DOS",
        "Source Avg Daily Forecast",
        "Destination Avg Daily Forecast",
        "Source Excess",
        "Destination Shortage",
        "Network Deficit",
        "DDOS Shortage",
        "Total Unfulfilled Shortage",
        "Arrival Date"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    rows = [] 
    for row in data:
        rows.append({
            "Source": row["src"],
            "Destination": row["dst"],
            "SKU": row["sku"],
            "Units": row["units"],
            "Source Inventory": row["src_current_inventory"],
            "Destination Inventory": row["dst_current_inventory"],
            "Source DOS": row["src_days_of_supply"],
            "Destination DOS": row["dst_days_of_supply"],
            "Source Avg Daily Forecast": row["src_daily_forecast"],
            "Destination Avg Daily Forecast": row["dst_daily_forecast"],
            "Source Excess": row["src_excess"],
            "Destination Shortage": row["dst_shortage"],
            "Network Deficit": row["network_deficit"],
            "DDOS Shortage": row["ddos_shortage"],
            "Total Unfulfilled Shortage": row["total_unfulfilled_shortage"],
            "Arrival Date": row["arrival_date"]
        })
    writer.writerows(rows)
    return output.getvalue()

def run_rebalancer(ddos_days: int):
    """
    Main rebalancer logic to run the Pulp optimization model.
    """
    if ddos_days <= 0:
        return {"error": "DDOS days must be a positive integer."}, None, None, None
    
    try:
        shortages_excesses = compute_shortages_excesses(ddos_days)
        transfer_info_map = get_transfer_costs()

        if not transfer_info_map:
            return [], shortages_excesses, transfer_info_map, {}

        excess = {(_normalize_key(r["store"]), _normalize_key(r["sku"])): r["excess"] for r in shortages_excesses if r["excess"] > 0}
        shortage = {(_normalize_key(r["store"]), _normalize_key(r["sku"])): r["shortage"] for r in shortages_excesses if r["shortage"] > 0}

        SHORTAGE_COST, LEAD_TIME_PENALTY_FACTOR = 1000, 5
        model = pulp.LpProblem("Rebalance", pulp.LpMinimize)
        x, y = {}, pulp.LpVariable.dicts("Shortage", shortage.keys(), 0, None, "Integer")

        for (src_store, sku) in excess.keys():
            for (dst_store, shortage_sku) in shortage.keys():
                if sku == shortage_sku and src_store != dst_store:
                    original_src = next((s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == src_store), None)
                    original_dst = next((s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == dst_store), None)
                    
                    if original_src and original_dst and original_src in transfer_info_map and original_dst in transfer_info_map.get(original_src, {}):
                        # FIX 1: Removed the overly restrictive lead time check (if transfer_lead_time <= ddos_days)
                        x[(src_store, dst_store, sku)] = pulp.LpVariable(f"x_{src_store}_{dst_store}_{sku}", 0, None, "Integer")
        
        cost_objective = pulp.lpSum(
            x[k] * (transfer_info_map[next(s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == k[0])][next(s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == k[1])]['cost'] + 
            transfer_info_map[next(s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == k[0])][next(s["store"] for s in shortages_excesses if _normalize_key(s["store"]) == k[1])]['lead_time'] * LEAD_TIME_PENALTY_FACTOR) for k in x
        ) + pulp.lpSum(y[k] * SHORTAGE_COST for k in y)
        model += cost_objective, "Total_Rebalancing_Cost"

        for (store, sku), e in excess.items(): model += pulp.lpSum(x[k] for k in x if k[0] == store and k[2] == sku) <= e
        for (store, sku), s in shortage.items(): model += pulp.lpSum(x[k] for k in x if k[1] == store and k[2] == sku) + y[store, sku] == s

        solver_status = model.solve(pulp.PULP_CBC_CMD(msg=False))
        logger.info(f"Solver status: {pulp.LpStatus[solver_status]}") 
        allocations = []
        unfulfilled_shortages = {}
        if pulp.LpStatus[solver_status] == "Optimal":
            for key, var in x.items():
                if var.varValue and var.varValue > 0:
                    src, dst, sku = key
                    units = int(var.varValue)
                    allocations.append({"src": src, "dst": dst, "sku": sku, "units": units})

            for key, var in y.items():
                if var.varValue and var.varValue > 0:
                    unfulfilled_shortages[key] = int(var.varValue)
        
        return allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages

    except Exception as e:
        logger.error(f"An error occurred during rebalancing: {e}", exc_info=True)
        return {"error": "Internal server error."}, None, None, None
    
def get_supply_details(store: str, sku: str, shortages_excesses: list, ddos_days: int):
    """
    Helper function to get inventory, DOS, daily forecast, excess, and shortage for a store/sku.
    """
    # Use a dictionary for faster lookups.
    # FIX: Normalize the keys from the shortages_excesses list when creating the data map.
    data_map = {(_normalize_key(item["store"]), _normalize_key(item["sku"])): item for item in shortages_excesses}
    
    item = data_map.get((store, sku)) # 'store' and 'sku' are already normalized from allocations
    
    if item:
        inv = item["inventory"]
        forecast = item["forecast"]
        excess = item["excess"]
        shortage = item["shortage"]
        
        # Daily demand is forecast divided by DDOS days. Handle division by zero.
        daily_demand = forecast / ddos_days if ddos_days > 0 else 0
        dos = inv / daily_demand if daily_demand > 0 else float('inf')
        
        return inv, round(dos, 2), round(daily_demand, 2), excess, shortage
    
    return 0, 0, 0, 0, 0

def get_transfer_group_supply_details(store: str, skus: set, shortages_excesses: list, ddos_days: int):
    """
    Computes overall inventory and days of supply for a store, for a specific group of SKUs.
    """
    total_inventory = 0
    total_forecast = 0
    
    # FIX: Create a quick lookup map for the shortages_excesses list using normalized store/sku keys
    data_map = {(_normalize_key(item["store"]), _normalize_key(item["sku"])): item for item in shortages_excesses}
    
    for sku in skus:
        # FIX: Look up using the normalized store and current sku
        item = data_map.get((store, sku))
        if item:
            total_inventory += item["inventory"]
            total_forecast += item["forecast"]
            
    # Daily demand is total forecast divided by DDOS days. Handle division by zero.
    daily_demand = total_forecast / ddos_days if ddos_days > 0 else 0
    
    # Days of Supply (DOS) is total inventory divided by daily demand.
    overall_dos = total_inventory / daily_demand if daily_demand > 0 else float('inf')
    
    return overall_dos, total_inventory, daily_demand

# --- START: FIX ---
# Swapped the last two parameters to match the argument order from the calling code in rebalancer.py
def get_transfer_details(allocations: list, shortages_excesses: list, transfer_info_map: dict, unfulfilled_shortages: dict, ddos_days: int):
# --- END: FIX ---
    """
    Enriches the allocation data with detailed information for the download view.
    """
    # Pre-calculate network-wide shortage and excess per SKU
    sku_network_metrics = defaultdict(lambda: {"total_shortage": 0, "total_excess": 0})
    for item in shortages_excesses:
        sku_network_metrics[item["sku"]]["total_shortage"] += item["shortage"]
        sku_network_metrics[item["sku"]]["total_excess"] += item["excess"]

    detailed_allocations = []
    today = date.today()
    for allocation in allocations:
        src, dst, sku, units = allocation['src'], allocation['dst'], allocation['sku'], allocation['units']
        
        src_inv, src_dos, src_daily_forecast, src_excess, _ = get_supply_details(src, sku, shortages_excesses, ddos_days)
        dst_inv, dst_dos, dst_daily_forecast, _, dst_shortage = get_supply_details(dst, sku, shortages_excesses, ddos_days)
        
        lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
        arrival_date = today + timedelta(days=lead_time)

        # Calculate new metrics
        normalized_key = (_normalize_key(dst), _normalize_key(sku))
        total_unfulfilled_shortage = unfulfilled_shortages.get(normalized_key, 0)
        
        network_deficit = max(0, sku_network_metrics[sku]["total_shortage"] - sku_network_metrics[sku]["total_excess"])
        
        ddos_shortage = max(0, total_unfulfilled_shortage - network_deficit)
        
        detailed_allocations.append({
            "src": src,
            "dst": dst,
            "sku": sku,
            "units": units,
            "src_current_inventory": src_inv,
            "dst_current_inventory": dst_inv,
            "src_days_of_supply": src_dos,
            "dst_days_of_supply": dst_dos,
            "src_daily_forecast": src_daily_forecast,
            "dst_daily_forecast": dst_daily_forecast,
            "src_excess": src_excess,
            "dst_shortage": dst_shortage,
            "network_deficit": network_deficit,
            "ddos_shortage": ddos_shortage,
            "total_unfulfilled_shortage": total_unfulfilled_shortage,
            "arrival_date": arrival_date.isoformat()
        })
    return detailed_allocations

def get_transfer_summary(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int):
    """Aggregates rebalancing allocations to provide a summary by src-dest pair."""
    summary = defaultdict(lambda: {"distinct_skus": set(), "total_units": 0, "arrival_date": None})
    today = date.today()
    
    for allocation in allocations:
        src, dst = allocation['src'], allocation['dst']
        key = (src, dst)
        summary[key]["distinct_skus"].add(allocation['sku'])
        summary[key]["total_units"] += allocation['units']
        
        lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
        arrival_date = today + timedelta(days=lead_time)
        summary[key]["arrival_date"] = arrival_date.isoformat()
        
    formatted_summary = []
    for (src, dst), data in summary.items():
        # Use the new helper function to get DOS and daily forecast for the transferred group of SKUs
        skus_in_transfer = data["distinct_skus"]
        src_dos, _, src_daily_forecast = get_transfer_group_supply_details(src, skus_in_transfer, shortages_excesses, ddos_days)
        dst_dos, _, dst_daily_forecast = get_transfer_group_supply_details(dst, skus_in_transfer, shortages_excesses, ddos_days)
        
        formatted_summary.append({
            "src": src, "dest": dst, "distinct_skus": len(data["distinct_skus"]),
            "total_units": data["total_units"],
            "src_days_of_supply": round(src_dos, 2),
            "dst_days_of_supply": round(dst_dos, 2),
            "src_daily_forecast": round(src_daily_forecast, 2),
            "dst_daily_forecast": round(dst_daily_forecast, 2),
            "arrival_date": data["arrival_date"]
        })
    return formatted_summary