
from datetime import date, timedelta
from sqlalchemy import func, select, union_all
from app import db
from app.models.inventory import InventorySnapshot
from app.models.predict import Forecast
from app.models.store import Store
from app.models.transfer_cost_data import transferCostDta
from app.models.rebalancer import RebalancerDetail
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

# --- NEW HELPER FUNCTION FOR STORE NAMES ---
def get_store_name_map():
    """Loads a mapping from store_code to store_name for final output display."""
    try:
        rows = db.session.query(Store.store_code, Store.name).all()
        return {row.store_code: row.name for row in rows}
    except Exception as e:
        logger.error(f"Failed to load store name map: {e}")
        return {}
# -----------------------------

# --- NEW HELPER FUNCTION FOR PRODUCT NAMES ---
def get_sku_name_map():
    """Loads a mapping from sku to product_name from the InventorySnapshot model."""
    try:
        latest_snapshot_subquery = select(
            InventorySnapshot.sku, 
            InventorySnapshot.product_name
        ).distinct()
        
        rows = db.session.execute(latest_snapshot_subquery).all()
        
        return {row.sku: row.product_name for row in rows if row.sku and row.product_name}
    except Exception as e:
        logger.error(f"Failed to load SKU name map: {e}")
        return {}
# -----------------------------

def compute_shortages_excesses(ddos_days: int):
    """
    Computes inventory shortages and excesses by retrieving the QTY from the 
    LATEST INVENTORY SNAPSHOT ONLY, and comparing against the forecast demand.
    (Store Code and SKU are used as stable identifiers.)
    """
    today = date.today()
    future = today + timedelta(days=ddos_days)

    MaxDate = select(func.max(InventorySnapshot.snapshot_date)).scalar_subquery().cte("max_date")
    
    inv_keys = select(InventorySnapshot.store_id, InventorySnapshot.sku).distinct()
    fc_keys = select(Store.store_id, Forecast.product_id.label("sku")).join(Store, Store.store_code == Forecast.store_id).distinct()
    all_keys_stmt = union_all(inv_keys, fc_keys).alias("all_keys")
    UniqueKeys = select(all_keys_stmt.c.store_id, all_keys_stmt.c.sku).distinct().cte("unique_keys")

    InvTotals = (
        select(
            InventorySnapshot.store_id,
            InventorySnapshot.sku,
            InventorySnapshot.qty.label("total_inventory"), 
        )
        .where(InventorySnapshot.snapshot_date == MaxDate.c.max)
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
        tgt_qty = float(r.forecast_units or 0)
        diff = int(inv_qty - tgt_qty)
        short = -diff if diff < 0 else 0
        excess = diff if diff > 0 else 0

        if short > 0 or excess > 0:
            results.append({
                "store": r.store_code, "sku": r.sku,
                "inventory": int(inv_qty), "target": int(tgt_qty),
                "forecast": int(tgt_qty), "shortage": short, "excess": excess,
            })
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
        "SKU", # This will now contain the product name
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
            "SKU": row["sku"], # Now contains product name
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

def get_store_coords_map():
    """Loads a mapping from store_code to its coordinates."""
    try:
        rows = db.session.query(Store.store_code, Store.latitude, Store.longitude).all()
        # Return coordinates as a [lat, lon] list for Leaflet
        return {row.store_code: [row.latitude, row.longitude] for row in rows}
    except Exception as e:
        logger.error(f"Failed to load store coordinates map: {e}")
        return {}

# MODIFIED: Now returns 6 values
def run_rebalancer(ddos_days: int):
    """
    Main rebalancer logic to run the Pulp optimization model.
    Returns 6 values: allocations, shortages_excesses, transfer_info_map, 
    unfulfilled_shortages, code_to_name_map, and sku_to_name_map.
    """
    # Adjusted to return 6 None values for consistency if error
    if ddos_days <= 0:
        return {"error": "DDOS days must be a positive integer."}, None, None, None, None, None, None
    
    try:
        shortages_excesses = compute_shortages_excesses(ddos_days)
        transfer_info_map = get_transfer_costs()
        code_to_name_map = get_store_name_map() # Store Code -> Store Name
        sku_to_name_map = get_sku_name_map()     # SKU -> Product Name (NEW)
        code_to_coords_map = get_store_coords_map()

        if not transfer_info_map:
            # Adjusted to return 6 values for consistency
            return [], shortages_excesses, transfer_info_map, {}, code_to_name_map, sku_to_name_map, code_to_coords_map

        # Map 1: Normalized Code (solver key) -> Original Code (cost lookup key)
        store_code_map = {_normalize_key(r["store"]): r["store"] for r in shortages_excesses}

        excess = {(_normalize_key(r["store"]), _normalize_key(r["sku"])): r["excess"] for r in shortages_excesses if r["excess"] > 0}
        shortage = {(_normalize_key(r["store"]), _normalize_key(r["sku"])): r["shortage"] for r in shortages_excesses if r["shortage"] > 0}

        SHORTAGE_COST, LEAD_TIME_PENALTY_FACTOR = 100000, 0.1
        model = pulp.LpProblem("Rebalance", pulp.LpMinimize)
        x, y = {}, pulp.LpVariable.dicts("Shortage", shortage.keys(), 0, None, "Integer")

        for (src_store, sku) in excess.keys():
            for (dst_store, shortage_sku) in shortage.keys():
                if sku == shortage_sku and src_store != dst_store:
                    # Look up original store codes for transfer cost map
                    original_src_code = store_code_map.get(src_store)
                    original_dst_code = store_code_map.get(dst_store)
                    
                    if original_src_code and original_dst_code and original_src_code in transfer_info_map and original_dst_code in transfer_info_map.get(original_src_code, {}):
                        x[(src_store, dst_store, sku)] = pulp.LpVariable(f"x_{src_store}_{dst_store}_{sku}", 0, None, "Integer")
        
        # Cost calculation uses original store codes via the store_code_map lookup
        cost_objective = pulp.lpSum(
            x[k] * (transfer_info_map[store_code_map.get(k[0])][store_code_map.get(k[1])]['cost'] + 
            transfer_info_map[store_code_map.get(k[0])][store_code_map.get(k[1])]['lead_time'] * LEAD_TIME_PENALTY_FACTOR) for k in x
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
                    src, dst, sku = key # These are the *normalized* store codes and SKUs
                    units = int(var.varValue)
                    allocations.append({"src": src, "dst": dst, "sku": sku, "units": units})

            for key, var in y.items():
                if var.varValue and var.varValue > 0:
                    unfulfilled_shortages[key] = int(var.varValue)
        
        # RETURN 6 VALUES INCLUDING BOTH MAPS
        return allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, code_to_name_map, sku_to_name_map, code_to_coords_map


    except Exception as e:
        logger.error(f"An error occurred during rebalancing: {e}", exc_info=True)
        return {"error": "Internal server error."}, None, None, None, None, None, None
    
# get_supply_details and get_transfer_group_supply_details remain UNCHANGED, 
# as they rely on the stable normalized store code and SKU for internal logic.
def get_supply_details(store: str, sku: str, shortages_excesses: list, ddos_days: int):
    """
    Helper function to get inventory, DOS, daily forecast, excess, and shortage for a store/sku.
    Note: 'store' and 'sku' inputs here are expected to be the *normalized* keys.
    """
    data_map = {(_normalize_key(item["store"]), _normalize_key(item["sku"])): item for item in shortages_excesses}
    
    item = data_map.get((store, sku))
    
    if item:
        inv = item["inventory"]
        forecast = item["forecast"]
        excess = item["excess"]
        shortage = item["shortage"]
        
        daily_demand = forecast / ddos_days if ddos_days > 0 else 0
        dos = inv / daily_demand if daily_demand > 0 else float('inf')
        
        return inv, round(dos, 2), round(daily_demand, 2), excess, shortage
    
    return 0, 0, 0, 0, 0

def get_transfer_group_supply_details(store: str, skus: set, shortages_excesses: list, ddos_days: int):
    """
    Computes overall inventory and days of supply for a store, for a specific group of SKUs.
    Note: 'store' and 'sku' inputs here are expected to be the *normalized* keys.
    """
    total_inventory = 0
    total_forecast = 0
    
    data_map = {(_normalize_key(item["store"]), _normalize_key(item["sku"])): item for item in shortages_excesses}
    
    for sku in skus:
        item = data_map.get((store, sku))
        if item:
            total_inventory += item["inventory"]
            total_forecast += item["forecast"]
            
    daily_demand = total_forecast / ddos_days if ddos_days > 0 else 0
    
    overall_dos = total_inventory / daily_demand if daily_demand > 0 else float('inf')
    
    return overall_dos, total_inventory, daily_demand

# MODIFIED: Now accepts sku_to_name_map and replaces SKU with Product Name
def get_transfer_details(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int, unfulfilled_shortages: dict, code_to_name_map: dict, sku_to_name_map: dict):
    """
    Enriches the allocation data with detailed information for the download view.
    The final output uses the original store names and product names.
    """
    # Pre-calculate network-wide shortage and excess per SKU
    sku_network_metrics = defaultdict(lambda: {"total_shortage": 0, "total_excess": 0})
    for item in shortages_excesses:
        sku_network_metrics[item["sku"]]["total_shortage"] += item["shortage"]
        sku_network_metrics[item["sku"]]["total_excess"] += item["excess"]

    # Map 2: Normalized Code -> Original Code (needed for lead time lookup)
    store_code_map = {_normalize_key(r["store"]): r["store"] for r in shortages_excesses}
    
    # Map 3: Normalized SKU -> Original SKU (needed for some lookups if normalization wasn't perfect, but mainly for clarity)
    sku_map = {_normalize_key(r["sku"]): r["sku"] for r in shortages_excesses}


    detailed_allocations = []
    today = date.today()
    for allocation in allocations:
        # These are the normalized keys
        src_norm, dst_norm, sku_norm, units = allocation['src'], allocation['dst'], allocation['sku'], allocation['units']
        
        # 1. Get original Store Codes (e.g., STR001)
        src_code = store_code_map.get(src_norm, src_norm) 
        dst_code = store_code_map.get(dst_norm, dst_norm) 
        
        # 2. Get original SKU (e.g., SKU001)
        sku_code = sku_map.get(sku_norm, sku_norm)

        # 3. Get the final display Names
        src_name = code_to_name_map.get(src_code, src_code)
        dst_name = code_to_name_map.get(dst_code, dst_code)
        sku_name = sku_to_name_map.get(sku_code, sku_code) # NEW

        # Use normalized keys for supply details lookup
        src_inv, src_dos, src_daily_forecast, src_excess, _ = get_supply_details(src_norm, sku_norm, shortages_excesses, ddos_days)
        dst_inv, dst_dos, dst_daily_forecast, _, dst_shortage = get_supply_details(dst_norm, sku_norm, shortages_excesses, ddos_days)
        
        # Use original Store Codes for transfer info map lookup
        lead_time = transfer_info_map.get(src_code, {}).get(dst_code, {}).get('lead_time', 0)
        arrival_date = today + timedelta(days=lead_time)

        # Calculate new metrics
        normalized_key = (dst_norm, sku_norm)
        total_unfulfilled_shortage = unfulfilled_shortages.get(normalized_key, 0)
        
        network_deficit = max(0, sku_network_metrics.get(sku_code, {}).get("total_shortage", 0) - sku_network_metrics.get(sku_code, {}).get("total_excess", 0))
        ddos_shortage = max(0, total_unfulfilled_shortage - network_deficit)
        
        detailed_allocations.append({
            "src": src_name,      # Use store name
            "dst": dst_name,      # Use store name
            "sku": sku_name,      # Use product name (NEW)
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

# MODIFIED: Now accepts sku_to_name_map and replaces SKU with Product Name
def get_transfer_summary(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int, code_to_name_map: dict, sku_to_name_map: dict, code_to_coords_map: dict):
    """Aggregates rebalancing allocations to provide a summary by src-dest pair, using store names and product names."""
    
    # Map 2: Normalized Code -> Original Code (needed for lead time lookup)
    store_code_map = {_normalize_key(r["store"]): r["store"] for r in shortages_excesses}
    
    # Map 3: Normalized SKU -> Original SKU
    sku_map = {_normalize_key(r["sku"]): r["sku"] for r in shortages_excesses}

    # Use normalized keys for the internal summary dict
    summary = defaultdict(lambda: {"distinct_skus": set(), "total_units": 0, "arrival_date": None, "src_name": None, "dst_name": None, "src_code": None, "dst_code": None}) # Added src/dst codes
    today = date.today()
    
    for allocation in allocations:
        src_norm, dst_norm = allocation['src'], allocation['dst']
        sku_norm = allocation['sku']
        
        # Get the original Store Codes
        src_code = store_code_map.get(src_norm, src_norm)
        dst_code = store_code_map.get(dst_norm, dst_norm)

        # Get the final Store Names
        src_name = code_to_name_map.get(src_code, src_code)
        dst_name = code_to_name_map.get(dst_code, dst_code)

        # Use normalized keys for the map lookup (stable)
        key = (src_norm, dst_norm)
        
        # Store the original SKU for later lookup (though summary only shows count)
        summary[key]["distinct_skus"].add(sku_map.get(allocation['sku'], allocation['sku']))
        summary[key]["total_units"] += allocation['units']
        # Store original names in the summary data
        summary[key]["src_code"] = src_code # <-- ADD THIS
        summary[key]["dst_code"] = dst_code # <-- ADD THIS
        summary[key]["src_name"] = code_to_name_map.get(src_code, src_code)
        summary[key]["dst_name"] = code_to_name_map.get(dst_code, dst_code)


        # Use original Store Codes for transfer info lookup
        lead_time = transfer_info_map.get(src_code, {}).get(dst_code, {}).get('lead_time', 0)
        arrival_date = today + timedelta(days=lead_time)
        summary[key]["arrival_date"] = arrival_date.isoformat()
        
    formatted_summary = []
    for (src_norm, dst_norm), data in summary.items():
        normalized_skus = {_normalize_key(sku) for sku in data["distinct_skus"]}

        src_dos, _, src_daily_forecast = get_transfer_group_supply_details(src_norm, normalized_skus, shortages_excesses, ddos_days)
        dst_dos, _, dst_daily_forecast = get_transfer_group_supply_details(dst_norm, normalized_skus, shortages_excesses, ddos_days)
        src_coords = code_to_coords_map.get(data["src_code"], [0, 0]) # Default to [0,0] if not found
        dest_coords = code_to_coords_map.get(data["dst_code"], [0, 0]) # Default to [0,0] if not found
        
        formatted_summary.append({
            "src": data["src_name"], # Use store name
            "dest": data["dst_name"], # Use store name
            "distinct_skus": len(data["distinct_skus"]),
            "total_units": data["total_units"],
            "source_coords": src_coords,      # <-- ADDED
            "destination_coords": dest_coords, # <-- ADDED
            "src_days_of_supply": round(src_dos, 2),
            "dst_days_of_supply": round(dst_dos, 2),
            "src_daily_forecast": round(src_daily_forecast, 2),
            "dst_daily_forecast": round(dst_daily_forecast, 2),
            "arrival_date": data["arrival_date"]
        })
    return formatted_summary

def save_rebalancer_details_to_db(detailed_allocations: list):
    """
    Saves the detailed allocations to the database.
    """
    try:
        records = []
        for item in detailed_allocations:
            record = RebalancerDetail(
                src_store_code=item.get("src"),
                src_store_name=item.get("src"),
                dst_store_code=item.get("dst"),
                dst_store_name=item.get("dst"),
                sku=item.get("sku"),
                product_name=item.get("sku"),
                units=item.get("units", 0),
                src_current_inventory=item.get("src_current_inventory", 0),
                dst_current_inventory=item.get("dst_current_inventory", 0),
                src_days_of_supply=item.get("src_days_of_supply", 0),
                dst_days_of_supply=item.get("dst_days_of_supply", 0),
                src_daily_forecast=item.get("src_daily_forecast", 0),
                dst_daily_forecast=item.get("dst_daily_forecast", 0),
                src_excess=item.get("src_excess", 0),
                dst_shortage=item.get("dst_shortage", 0),
                network_deficit=item.get("network_deficit", 0),
                ddos_shortage=item.get("ddos_shortage", 0),
                total_unfulfilled_shortage=item.get("total_unfulfilled_shortage", 0),
                arrival_date=item.get("arrival_date")
            )
            records.append(record)

        db.session.bulk_save_objects(records)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to save rebalancer details: {e}", exc_info=True)
        return False

