from datetime import date, timedelta
from sqlalchemy import func
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

def compute_shortages_excesses(ddos_days: int):
    """
    Computes inventory shortages and excesses based on DDOS and forecast.
    """
    today = date.today()
    future = today + timedelta(days=ddos_days)

    rows = (
        db.session.query(
            Store.store_code,
            InventorySnapshot.sku,
            func.sum(InventorySnapshot.qty).label("inventory"),
            func.coalesce(func.sum(Forecast.predicted), 0).label("forecast_units")
        )
        .join(Store, Store.store_id == InventorySnapshot.store_id)
        .outerjoin(
            Forecast,
            (Forecast.store_id == Store.store_code) & 
            (Forecast.product_id == InventorySnapshot.sku) &
            (Forecast.date >= today) &
            (Forecast.date < future)
        )
        .group_by(Store.store_code, InventorySnapshot.sku)
        .all()
    )

    results = []
    for r in rows:
        inv_qty = float(r.inventory or 0)
        
        tgt_qty = float(r.forecast_units or 0)

        diff = int(inv_qty - tgt_qty)
        short = -diff if diff < 0 else 0
        excess = diff if diff > 0 else 0

        results.append({
            "store": r.store_code,
            "sku": r.sku,
            "inventory": int(inv_qty),
            "target": int(tgt_qty),
            "shortage": short,
            "excess": excess,
        })
        print(f"[DEBUG] Store={r.store_code} SKU={r.sku} Inv={int(inv_qty)} Target={int(tgt_qty)} Short={short} Excess={excess}")
    return results

def get_transfer_costs():
    """
    Loads transfer costs and lead times from the database into a dictionary for fast lookups.
    Returns: { 'src': { 'dst': {'cost': ..., 'lead_time': ...}, ... }, ... }
    """
    costs = {}
    try:
        rows = db.session.query(transferCostDta).all()
        for row in rows:
            src = row.start_location
            dst = row.end_location
            if src not in costs:
                costs[src] = {}
            costs[src][dst] = {"cost": row.transfer_cost, "lead_time": row.lead_time}
    except Exception as e:
        logger.error(f"Failed to load transfer costs: {e}")
        return None
    return costs

def convert_to_csv(data):
    """
    Converts a list of dictionaries to a CSV formatted string.
    """
    if not data:
        return ""
    
    output = StringIO()
    keys = data[0].keys()
    writer = csv.DictWriter(output, fieldnames=keys)
    
    writer.writeheader()
    writer.writerows(data)
    
    return output.getvalue()

def run_rebalancer(ddos_days: int):
    """
    Main rebalancer logic to run the Pulp optimization model.
    """
    if ddos_days <= 0:
        return {"error": "DDOS days must be a positive integer."}
    
    try:
        shortages_excesses = compute_shortages_excesses(ddos_days)
        transfer_info_map = get_transfer_costs()

        if not transfer_info_map:
            return []

        excess = {(r["store"], r["sku"]): r["excess"] for r in shortages_excesses if r["excess"] > 0}
        shortage = {(r["store"], r["sku"]): r["shortage"] for r in shortages_excesses if r["shortage"] > 0}

        # Define cost parameters (must be calibrated by business)
        SHORTAGE_COST = 1000  # Cost per unit of unfulfilled demand
        LEAD_TIME_PENALTY_FACTOR = 5 # Penalty cost per day of lead time

        model = pulp.LpProblem("Rebalance", pulp.LpMinimize)
        x = {}

        # Corrected loop logic to create variables
        for (src_store, sku) in excess.keys():
            for (dst_store, shortage_sku) in shortage.keys():
                if sku == shortage_sku:
                    if src_store != dst_store and src_store in transfer_info_map and dst_store in transfer_info_map[src_store]:
                        # NEW CONSTRAINT: Check if lead time is within DDOS
                        transfer_lead_time = transfer_info_map[src_store][dst_store]['lead_time']
                        if transfer_lead_time <= ddos_days:
                            var_name = f"x_{src_store}_{dst_store}_{sku}"
                            x[(src_store, dst_store, sku)] = pulp.LpVariable(var_name, lowBound=0, cat="Integer")

        # Create variables for remaining shortages (unfulfilled demand)
        y = pulp.LpVariable.dicts("Shortage", shortage.keys(), lowBound=0, cat="Integer")

        # Objective Function: Minimize (Transfer Cost + Lead Time Penalty) + Shortage Cost
        model += (
            pulp.lpSum(
                x[key] * (
                    transfer_info_map[key[0]][key[1]]['cost'] +
                    transfer_info_map[key[0]][key[1]]['lead_time'] * LEAD_TIME_PENALTY_FACTOR
                )
                for key in x
            )
            + pulp.lpSum(y[key] * SHORTAGE_COST for key in y)
        ), "Total_Rebalancing_Cost"

        # Constraints
        # Total units out of a source cannot exceed its excess
        for (store, sku), e in excess.items():
            model += pulp.lpSum(x[key] for key in x if key[0] == store and key[2] == sku) <= e, f"Excess_Constraint_{store}_{sku}"

        # Total units received + remaining shortage must equal the original shortage
        for (store, sku), s in shortage.items():
            model += pulp.lpSum(x[key] for key in x if key[1] == store and key[2] == sku) + y[store, sku] == s, f"Shortage_Constraint_{store}_{sku}"

        # Solve the model
        solver_status = model.solve(pulp.PULP_CBC_CMD(msg=False))
        logger.info(f"Solver status: {pulp.LpStatus[solver_status]}")

        # Extract and format the results
        allocations = []
        if pulp.LpStatus[solver_status] == "Optimal":
            for key, var in x.items():
                if var.varValue and var.varValue > 0:
                    src, dst, sku = key
                    units = int(var.varValue)
                    allocations.append({"src": src, "dst": dst, "sku": sku, "units": units})
        
        return allocations

    except Exception as e:
        logger.error(f"An error occurred during rebalancing: {e}", exc_info=True)
        return {"error": "Internal server error."}
    
def get_transfer_summary(allocations: list):
    """
    Aggregates rebalancing allocations to provide a summary by src-dest pair.
    """
    summary = defaultdict(lambda: {"distinct_skus": set(), "total_units": 0})
    
    for allocation in allocations:
        src = allocation['src']
        dst = allocation['dst']
        sku = allocation['sku']
        units = allocation['units']
        
        summary[(src, dst)]["distinct_skus"].add(sku)
        summary[(src, dst)]["total_units"] += units
        
    formatted_summary = []
    for (src, dst), data in summary.items():
        formatted_summary.append({
            "src": src,
            "dest": dst,
            "distinct_skus": len(data["distinct_skus"]),
            "total_units": data["total_units"]
        })
        
    return formatted_summary