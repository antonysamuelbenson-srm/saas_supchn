# from flask import Blueprint, request, jsonify, Response
# from app.services.rebalancer_services import (
#     run_rebalancer, 
#     convert_to_csv, 
#     get_transfer_summary,
#     get_transfer_details
# )
# from app.utils.decorators import role_required
# import logging
# from datetime import date

# logger = logging.getLogger(__name__)
# bp = Blueprint("rebalance", __name__)

# @bp.route("/rebalance", methods=["POST"])
# @role_required
# def get_rebalancing_recommendations():
#     """
#     API endpoint to get rebalancing recommendations and return JSON.
#     This single endpoint now returns both detailed and summary data.
#     """
#     try:
#         data = request.json or {}
#         ddos_days = data.get("ddos_days", 28)

#         if not isinstance(ddos_days, int) or ddos_days <= 0:
#             return jsonify({"error": "ddos_days must be a positive integer."}), 400

#         allocations, shortages_excesses, transfer_info_map = run_rebalancer(ddos_days)

#         if "error" in allocations:
#             return jsonify(allocations), 500
        
#         # Get enriched, detailed recommendations
#         detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, ddos_days)
        
#         # Get summary data and include it in the response
#         summary_data = get_transfer_summary(allocations, shortages_excesses, transfer_info_map, ddos_days)
        
#         return jsonify({
#             "allocations": detailed_allocations,
#             "summary": summary_data,
#             "message": "Rebalancing completed successfully."
#         }), 200

#     except Exception as e:
#         logger.error(f"An unhandled error occurred in the route: {e}", exc_info=True)
#         return jsonify({"error": "An unexpected error occurred."}), 500


# from flask import Blueprint, request, jsonify, Response
# from app.services.rebalancer_services import (
#     run_rebalancer,
#     convert_to_csv,
#     get_transfer_summary,
#     get_transfer_details
# )
# from app.utils.decorators import role_required
# import logging
# from datetime import date

# logger = logging.getLogger(__name__)
# bp = Blueprint("rebalance", __name__)

# @bp.route("/rebalance", methods=["POST"])
# @role_required
# def get_rebalancing_recommendations():
#     """
#     API endpoint to get rebalancing recommendations and return JSON.
#     This single endpoint now returns both detailed and summary data.
#     The detailed data is enriched with inventory, demand, and DOS info.
#     """
#     try:
#         data = request.json or {}
#         ddos_days = data.get("ddos_days", 28)

#         if not isinstance(ddos_days, int) or ddos_days <= 0:
#             return jsonify({"error": "ddos_days must be a positive integer."}), 400

#         allocations, shortages_excesses, transfer_info_map = run_rebalancer(ddos_days)

#         if "error" in allocations:
#             return jsonify(allocations), 500

#         # ### START: FIX FOR THE AttributeError ###
#         # Convert the list of shortages/excesses into a nested dictionary for fast lookups.
#         # The new structure will be: {'location': {'sku': {details...}}}
#         shortages_map = {}
#         for item in shortages_excesses:
#             # Assuming keys 'Store' and 'SKU' based on your logs
#             store = item.get("Store")
#             sku = item.get("SKU")
#             if store and sku:
#                 if store not in shortages_map:
#                     shortages_map[store] = {}
#                 shortages_map[store][sku] = item
#         # ### END: FIX FOR THE AttributeError ###

#         # Get the base detailed recommendations
#         detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, ddos_days)

#         # Enrich the detailed allocations with the requested information
#         for alloc in detailed_allocations:
#             source_loc = alloc.get("from")
#             dest_loc = alloc.get("to")
#             sku = alloc.get("sku") # Important: Assuming the allocation item contains the SKU

#             # Safely get data from the newly created shortages_map
#             source_data = shortages_map.get(source_loc, {}).get(sku, {})
#             dest_data = shortages_map.get(dest_loc, {}).get(sku, {})

#             # 1 & 2. Add inventory for source and destination (using 'Inv' from your logs)
#             alloc["source_inventory"] = source_data.get("Inv")
#             alloc["dest_inventory"] = dest_data.get("Inv")

#             # 3. Add demand and Days of Supply for the destination
#             # NOTE: Adjust these keys ('Target', 'current_dos') if they are different in your data
#             alloc["dest_demand"] = dest_data.get("Target") 
#             alloc["dest_days_of_supply"] = dest_data.get("current_dos") 

#             # 4. Add supporting info for the recommendation
#             dos_string = f"{alloc['dest_days_of_supply']:.2f}" if isinstance(alloc['dest_days_of_supply'], (int, float)) else "N/A"
#             alloc["supporting_info"] = (
#                 f"Recommendation to cover a projected deficit for {sku} at '{dest_loc}'. "
#                 f"Destination currently has {dos_string} days of supply "
#                 f"against a demand target of {alloc['dest_demand']} units."
#             )

#         # Get summary data
#         summary_data = get_transfer_summary(allocations, shortages_excesses, transfer_info_map, ddos_days)

#         return jsonify({
#             "allocations": detailed_allocations,
#             "summary": summary_data,
#             "message": "Rebalancing completed successfully."
#         }), 200

#     except Exception as e:
#         logger.error(f"An unhandled error occurred in the route: {e}", exc_info=True)
#         return jsonify({"error": "An unexpected error occurred."}), 500
    

# # In your Flask blueprint file (e.g., rebalance_routes.py)

# @bp.route("/rebalance/download", methods=["POST"])
# @role_required
# def download_rebalancing_report():
#     """
#     API endpoint to generate and download a detailed CSV report of rebalancing recommendations.
#     """
#     try:
#         data = request.json or {}
#         ddos_days = data.get("ddos_days", 28)

#         if not isinstance(ddos_days, int) or ddos_days <= 0:
#             return jsonify({"error": "ddos_days must be a positive integer."}), 400

#         # --- Reuse the existing logic to get the data ---
#         allocations, shortages_excesses, transfer_info_map = run_rebalancer(ddos_days)

#         if "error" in allocations:
#             return jsonify(allocations), 500
        
#         # NOTE: You can reuse the data enrichment logic from your other route if needed for the CSV
#         detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, ddos_days)
        
#         if not detailed_allocations:
#             # Although the frontend handles this, it's good practice for the API too
#             return jsonify({"message": "No data to download."}), 200

#         # --- Convert data to CSV ---
#         csv_data = convert_to_csv(detailed_allocations)
        
#         today = date.today().isoformat()
#         filename = f"rebalancing_recommendations_{today}.csv"

#         # --- Return the CSV as a response ---
#         return Response(
#             csv_data,
#             mimetype="text/csv",
#             headers={"Content-disposition": f"attachment; filename={filename}"}
#         )

#     except Exception as e:
#         logger.error(f"Failed to generate download file: {e}", exc_info=True)
#         return jsonify({"error": "Could not generate the file for download."}), 500


from flask import Blueprint, request, jsonify, Response
from app.services.rebalancer_services import (
    run_rebalancer,
    convert_to_csv,
    get_transfer_summary,
    get_transfer_details
)
from app.utils.decorators import role_required
import logging
from datetime import date

logger = logging.getLogger(__name__)
bp = Blueprint("rebalance", __name__)


def _enrich_allocations(allocations_list, shortages_excesses_list):
    """Enriches allocation details with inventory, demand, and DOS info."""
    
    shortages_map = {}
    for item in shortages_excesses_list:
        store = item.get("Store")
        sku = item.get("SKU")
        if store and sku:
            if store not in shortages_map:
                shortages_map[store] = {}
            shortages_map[store][sku] = item

    for alloc in allocations_list:
        source_loc = alloc.get("from")
        dest_loc = alloc.get("to")
        sku = alloc.get("sku")

        source_data = shortages_map.get(source_loc, {}).get(sku, {})
        dest_data = shortages_map.get(dest_loc, {}).get(sku, {})

        alloc["source_inventory"] = source_data.get("Inv")
        alloc["dest_inventory"] = dest_data.get("Inv")
        alloc["dest_demand"] = dest_data.get("Target")
        alloc["dest_days_of_supply"] = dest_data.get("current_dos")
    
    return allocations_list


@bp.route("/rebalance", methods=["POST"])
@role_required
def get_rebalancing_recommendations():
    """API endpoint to get rebalancing recommendations and return JSON."""
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)

        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        # Capture all expected return values from the service function
        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, *_ = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        # Pass the newly captured 'unfulfilled_shortages' variable to this function
        detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, ddos_days)
        
        enriched_allocations = _enrich_allocations(detailed_allocations, shortages_excesses)
        
        summary_data = get_transfer_summary(allocations, shortages_excesses, transfer_info_map, ddos_days)
        
        return jsonify({
            "allocations": enriched_allocations,
            "summary": summary_data,
            "message": "Rebalancing completed successfully."
        }), 200

    except Exception as e:
        logger.error(f"An unhandled error occurred in the route: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500


@bp.route("/rebalance/download", methods=["POST"])
@role_required
def download_rebalancing_report():
    """API endpoint to generate and download a detailed CSV report."""
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)

        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        # Capture all expected return values from the service function
        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, *_ = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        # Pass the newly captured 'unfulfilled_shortages' variable to this function
        detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, ddos_days)

        enriched_allocations = _enrich_allocations(detailed_allocations, shortages_excesses)
        
        if not enriched_allocations:
            return jsonify({"message": "No data to download."}), 200

        csv_data = convert_to_csv(enriched_allocations)
        
        today = date.today().isoformat()
        filename = f"rebalancing_recommendations_{today}.csv"

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        logger.error(f"Failed to generate download file: {e}", exc_info=True)
        return jsonify({"error": "Could not generate the file for download."}), 500