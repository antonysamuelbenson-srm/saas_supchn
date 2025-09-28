# from datetime import date, timedelta
# from sqlalchemy import func
# from app import db
# from app.models.inventory import InventorySnapshot
# from app.models.predict import Forecast
# from app.models.store import Store
# from app.models.transfer_cost_data import transferCostDta
# import pulp
# import logging
# import csv
# from io import StringIO
# from collections import defaultdict

# logger = logging.getLogger(__name__)

# def compute_shortages_excesses(ddos_days: int):
#     """
#     Computes inventory shortages and excesses based on DDOS and forecast.
#     """
#     today = date.today()
#     future = today + timedelta(days=ddos_days)

#     rows = (
#         db.session.query(
#             Store.store_code,
#             InventorySnapshot.sku,
#             func.sum(InventorySnapshot.qty).label("inventory"),
#             func.coalesce(func.sum(Forecast.predicted), 0).label("forecast_units")
#         )
#         .join(Store, Store.store_id == InventorySnapshot.store_id)
#         .outerjoin(
#             Forecast,
#             (Forecast.store_id == Store.store_code) &
#             (Forecast.product_id == InventorySnapshot.sku) &
#             (Forecast.date >= today) &
#             (Forecast.date < future)
#         )
#         .group_by(Store.store_code, InventorySnapshot.sku)
#         .all()
#     )

#     results = []
#     for r in rows:
#         inv_qty = float(r.inventory or 0)
        
#         tgt_qty = float(r.forecast_units or 0)

#         diff = int(inv_qty - tgt_qty)
#         short = -diff if diff < 0 else 0
#         excess = diff if diff > 0 else 0

#         results.append({
#             "store": r.store_code,
#             "sku": r.sku,
#             "inventory": int(inv_qty),
#             "target": int(tgt_qty),
#             "forecast": int(tgt_qty), # Store forecast explicitly
#             "shortage": short,
#             "excess": excess,
#         })
#         print(f"[DEBUG] Store={r.store_code} SKU={r.sku} Inv={int(inv_qty)} Target={int(tgt_qty)} Short={short} Excess={excess}")
#     return results

# def get_transfer_costs():
#     """
#     Loads transfer costs and lead times from the database into a dictionary for fast lookups.
#     Returns: { 'src': { 'dst': {'cost': ..., 'lead_time': ...}, ... }, ... }
#     """
#     costs = {}
#     try:
#         rows = db.session.query(transferCostDta).all()
#         for row in rows:
#             src = row.start_location
#             dst = row.end_location
#             if src not in costs:
#                 costs[src] = {}
#             costs[src][dst] = {"cost": row.transfer_cost, "lead_time": row.lead_time}
#     except Exception as e:
#         logger.error(f"Failed to load transfer costs: {e}")
#         return None
#     return costs

# def convert_to_csv(data):
#     """
#     Converts a list of dictionaries to a CSV formatted string.
    
#     This function has been updated to use explicit column names to ensure
#     consistent and correct headers in the output file.
#     """
#     if not data:
#         return ""
    
#     output = StringIO()
    
#     # Explicitly define the column names for the CSV file
#     fieldnames = [
#         "Source",
#         "Destination",
#         "SKU",
#         "Units",
#         "Source Inventory",
#         "Destination Inventory",
#         "Source DOS",
#         "Destination DOS",
#         "Arrival Date"
#     ]
    
#     writer = csv.DictWriter(output, fieldnames=fieldnames)
    
#     # Create a new list of dictionaries with keys matching the fieldnames
#     rows = []
#     for row in data:
#         rows.append({
#             "Source": row["src"],
#             "Destination": row["dst"],
#             "SKU": row["sku"],
#             "Units": row["units"],
#             "Source Inventory": row["src_current_inventory"],
#             "Destination Inventory": row["dst_current_inventory"],
#             "Source DOS": row["src_days_of_supply"],
#             "Destination DOS": row["dst_days_of_supply"],
#             "Arrival Date": row["arrival_date"]
#         })

#     writer.writeheader()
#     writer.writerows(rows)
    
#     return output.getvalue()

# def run_rebalancer(ddos_days: int):
#     """
#     Main rebalancer logic to run the Pulp optimization model.
#     """
#     if ddos_days <= 0:
#         return {"error": "DDOS days must be a positive integer."}, None, None
    
#     try:
#         shortages_excesses = compute_shortages_excesses(ddos_days)
#         transfer_info_map = get_transfer_costs()

#         if not transfer_info_map:
#             return [], shortages_excesses, transfer_info_map

#         excess = {(r["store"], r["sku"]): r["excess"] for r in shortages_excesses if r["excess"] > 0}
#         shortage = {(r["store"], r["sku"]): r["shortage"] for r in shortages_excesses if r["shortage"] > 0}

#         # Define cost parameters (must be calibrated by business)
#         SHORTAGE_COST = 1000  # Cost per unit of unfulfilled demand
#         LEAD_TIME_PENALTY_FACTOR = 5 # Penalty cost per day of lead time

#         model = pulp.LpProblem("Rebalance", pulp.LpMinimize)
#         x = {}

#         # Corrected loop logic to create variables
#         for (src_store, sku) in excess.keys():
#             for (dst_store, shortage_sku) in shortage.keys():
#                 if sku == shortage_sku:
#                     if src_store != dst_store and src_store in transfer_info_map and dst_store in transfer_info_map[src_store]:
#                         # NEW CONSTRAINT: Check if lead time is within DDOS
#                         transfer_lead_time = transfer_info_map[src_store][dst_store]['lead_time']
#                         if transfer_lead_time <= ddos_days:
#                             var_name = f"x_{src_store}_{dst_store}_{sku}"
#                             x[(src_store, dst_store, sku)] = pulp.LpVariable(var_name, lowBound=0, cat="Integer")

#         # Create variables for remaining shortages (unfulfilled demand)
#         y = pulp.LpVariable.dicts("Shortage", shortage.keys(), lowBound=0, cat="Integer")

#         # Objective Function: Minimize (Transfer Cost + Lead Time Penalty) + Shortage Cost
#         model += (
#             pulp.lpSum(
#                 x[key] * (
#                     transfer_info_map[key[0]][key[1]]['cost'] +
#                     transfer_info_map[key[0]][key[1]]['lead_time'] * LEAD_TIME_PENALTY_FACTOR
#                 )
#                 for key in x
#             )
#             + pulp.lpSum(y[key] * SHORTAGE_COST for key in y)
#         ), "Total_Rebalancing_Cost"

#         # Constraints
#         # Total units out of a source cannot exceed its excess
#         for (store, sku), e in excess.items():
#             model += pulp.lpSum(x[key] for key in x if key[0] == store and key[2] == sku) <= e, f"Excess_Constraint_{store}_{sku}"

#         # Total units received + remaining shortage must equal the original shortage
#         for (store, sku), s in shortage.items():
#             model += pulp.lpSum(x[key] for key in x if key[1] == store and key[2] == sku) + y[store, sku] == s, f"Shortage_Constraint_{store}_{sku}"

#         # Solve the model
#         solver_status = model.solve(pulp.PULP_CBC_CMD(msg=False))
#         logger.info(f"Solver status: {pulp.LpStatus[solver_status]}")

#         # Extract and format the results
#         allocations = []
#         if pulp.LpStatus[solver_status] == "Optimal":
#             for key, var in x.items():
#                 if var.varValue and var.varValue > 0:
#                     src, dst, sku = key
#                     units = int(var.varValue)
#                     allocations.append({"src": src, "dst": dst, "sku": sku, "units": units})
        
#         return allocations, shortages_excesses, transfer_info_map

#     except Exception as e:
#         logger.error(f"An error occurred during rebalancing: {e}", exc_info=True)
#         return {"error": "Internal server error."}, None, None
    
# def get_supply_details(store: str, sku: str, shortages_excesses: list, ddos_days: int):
#     """
#     Helper function to get inventory and days of supply for a store/sku.
#     """
#     # Use a dictionary for faster lookups.
#     data_map = {(item["store"], item["sku"]): item for item in shortages_excesses}
    
#     item = data_map.get((store, sku))
    
#     if item:
#         inv = item["inventory"]
#         forecast = item["forecast"]
        
#         # Daily demand is forecast divided by DDOS days. Handle division by zero.
#         daily_demand = forecast / ddos_days if ddos_days > 0 else 0
        
#         # Days of Supply (DOS) is current inventory divided by daily demand. Handle division by zero.
#         dos = inv / daily_demand if daily_demand > 0 else float('inf')
        
#         return inv, round(dos, 2)
    
#     return 0, 0

# def get_transfer_group_supply_details(store: str, skus: set, shortages_excesses: list, ddos_days: int):
#     """
#     Computes overall inventory and days of supply for a store, for a specific group of SKUs.
#     """
#     total_inventory = 0
#     total_forecast = 0
    
#     for item in shortages_excesses:
#         if item["store"] == store and item["sku"] in skus:
#             total_inventory += item["inventory"]
#             total_forecast += item["forecast"]
            
#     # Daily demand is total forecast divided by DDOS days. Handle division by zero.
#     daily_demand = total_forecast / ddos_days if ddos_days > 0 else 0
    
#     # Days of Supply (DOS) is total inventory divided by daily demand.
#     overall_dos = total_inventory / daily_demand if daily_demand > 0 else float('inf')
    
#     return overall_dos, total_inventory

# def get_transfer_details(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int):
#     """
#     Enriches the allocation data with detailed information for the download view.
#     """
#     detailed_allocations = []
#     today = date.today()
#     for allocation in allocations:
#         src = allocation['src']
#         dst = allocation['dst']
#         sku = allocation['sku']
#         units = allocation['units']
        
#         src_inv, src_dos = get_supply_details(src, sku, shortages_excesses, ddos_days)
#         dst_inv, dst_dos = get_supply_details(dst, sku, shortages_excesses, ddos_days)
        
#         lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
#         arrival_date = today + timedelta(days=lead_time)
        
#         detailed_allocations.append({
#             "src": src,
#             "dst": dst,
#             "sku": sku,
#             "units": units,
#             "src_current_inventory": src_inv,
#             "dst_current_inventory": dst_inv,
#             "src_days_of_supply": src_dos,
#             "dst_days_of_supply": dst_dos,
#             "arrival_date": arrival_date.isoformat()
#         })
#     return detailed_allocations

# def get_transfer_summary(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int):
#     """
#     Aggregates rebalancing allocations to provide a summary by src-dest pair,
#     including DOS for the transferred SKUs and arrival dates.
#     """
#     summary = defaultdict(lambda: {"distinct_skus": set(), "total_units": 0, "arrival_date": None})
    
#     for allocation in allocations:
#         src = allocation['src']
#         dst = allocation['dst']
#         sku = allocation['sku']
#         units = allocation['units']
        
#         # Calculate arrival date
#         lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
#         arrival_date = date.today() + timedelta(days=lead_time)
        
#         summary[(src, dst)]["distinct_skus"].add(sku)
#         summary[(src, dst)]["total_units"] += units
#         summary[(src, dst)]["arrival_date"] = arrival_date.isoformat()
        
#     formatted_summary = []
#     for (src, dst), data in summary.items():
#         # Use the new helper function to get DOS for the transferred group of SKUs
#         skus_in_transfer = data["distinct_skus"]
#         src_dos, _ = get_transfer_group_supply_details(src, skus_in_transfer, shortages_excesses, ddos_days)
#         dst_dos, _ = get_transfer_group_supply_details(dst, skus_in_transfer, shortages_excesses, ddos_days)
        
#         formatted_summary.append({
#             "src": src,
#             "dest": dst,
#             "distinct_skus": len(data["distinct_skus"]),
#             "total_units": data["total_units"],
#             "src_days_of_supply": round(src_dos, 2),
#             "dst_days_of_supply": round(dst_dos, 2),
#             "arrival_date": data["arrival_date"]
#         })
        
#     return formatted_summary


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
            "forecast": int(tgt_qty), # Store forecast explicitly
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
    
    This function has been updated to use explicit column names to ensure
    consistent and correct headers in the output file.
    """
    if not data:
        return ""
    
    output = StringIO()
    
    # Explicitly define the column names for the CSV file
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
    
    # Create a new list of dictionaries with keys matching the fieldnames
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

    writer.writeheader()
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
    data_map = {(item["store"], item["sku"]): item for item in shortages_excesses}
    
    item = data_map.get((store, sku))
    
    if item:
        inv = item["inventory"]
        forecast = item["forecast"]
        excess = item["excess"]
        shortage = item["shortage"]
        
        # Daily demand is forecast divided by DDOS days. Handle division by zero.
        daily_demand = forecast / ddos_days if ddos_days > 0 else 0
        
        # Days of Supply (DOS) is current inventory divided by daily demand. Handle division by zero.
        dos = inv / daily_demand if daily_demand > 0 else float('inf')
        
        return inv, round(dos, 2), round(daily_demand, 2), excess, shortage
    
    return 0, 0, 0, 0, 0

def get_transfer_group_supply_details(store: str, skus: set, shortages_excesses: list, ddos_days: int):
    """
    Computes overall inventory and days of supply for a store, for a specific group of SKUs.
    """
    total_inventory = 0
    total_forecast = 0
    
    for item in shortages_excesses:
        if item["store"] == store and item["sku"] in skus:
            total_inventory += item["inventory"]
            total_forecast += item["forecast"]
            
    # Daily demand is total forecast divided by DDOS days. Handle division by zero.
    daily_demand = total_forecast / ddos_days if ddos_days > 0 else 0
    
    # Days of Supply (DOS) is total inventory divided by daily demand.
    overall_dos = total_inventory / daily_demand if daily_demand > 0 else float('inf')
    
    return overall_dos, total_inventory, daily_demand

def get_transfer_details(allocations: list, shortages_excesses: list, transfer_info_map: dict, ddos_days: int, unfulfilled_shortages: dict):
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
        src = allocation['src']
        dst = allocation['dst']
        sku = allocation['sku']
        units = allocation['units']
        
        src_inv, src_dos, src_daily_forecast, src_excess, _ = get_supply_details(src, sku, shortages_excesses, ddos_days)
        dst_inv, dst_dos, dst_daily_forecast, _, dst_shortage = get_supply_details(dst, sku, shortages_excesses, ddos_days)
        
        lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
        arrival_date = today + timedelta(days=lead_time)

        # Calculate new metrics
        total_unfulfilled_shortage = unfulfilled_shortages.get((dst, sku), 0)
        
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
    """
    Aggregates rebalancing allocations to provide a summary by src-dest pair,
    including DOS for the transferred SKUs and arrival dates.
    """
    summary = defaultdict(lambda: {"distinct_skus": set(), "total_units": 0, "arrival_date": None})
    
    for allocation in allocations:
        src = allocation['src']
        dst = allocation['dst']
        sku = allocation['sku']
        units = allocation['units']
        
        # Calculate arrival date
        lead_time = transfer_info_map.get(src, {}).get(dst, {}).get('lead_time', 0)
        arrival_date = date.today() + timedelta(days=lead_time)
        
        summary[(src, dst)]["distinct_skus"].add(sku)
        summary[(src, dst)]["total_units"] += units
        summary[(src, dst)]["arrival_date"] = arrival_date.isoformat()
        
    formatted_summary = []
    for (src, dst), data in summary.items():
        # Use the new helper function to get DOS and daily forecast for the transferred group of SKUs
        skus_in_transfer = data["distinct_skus"]
        src_dos, _, src_daily_forecast = get_transfer_group_supply_details(src, skus_in_transfer, shortages_excesses, ddos_days)
        dst_dos, _, dst_daily_forecast = get_transfer_group_supply_details(dst, skus_in_transfer, shortages_excesses, ddos_days)
        
        formatted_summary.append({
            "src": src,
            "dest": dst,
            "distinct_skus": len(data["distinct_skus"]),
            "total_units": data["total_units"],
            "src_days_of_supply": round(src_dos, 2),
            "dst_days_of_supply": round(dst_dos, 2),
            "src_daily_forecast": round(src_daily_forecast, 2),
            "dst_daily_forecast": round(dst_daily_forecast, 2),
            "arrival_date": data["arrival_date"]
        })
        
    return formatted_summary
