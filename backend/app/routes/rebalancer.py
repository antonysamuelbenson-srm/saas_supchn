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
    
    # Create a lookup map for efficient data retrieval
    shortages_map = {}
    for item in shortages_excesses_list:
        store = item.get("Store")
        sku = item.get("SKU")
        if store and sku:
            if store not in shortages_map:
                shortages_map[store] = {}
            shortages_map[store][sku] = item

    # Enrich each allocation record
    for alloc in allocations_list:
        source_loc = alloc.get("from")
        dest_loc = alloc.get("to")
        sku = alloc.get("sku")

        source_data = shortages_map.get(source_loc, {}).get(sku, {})
        dest_data = shortages_map.get(dest_loc, {}).get(sku, {})

        # Add inventory, demand, and DOS data
        alloc["source_inventory"] = source_data.get("Inv")
        alloc["dest_inventory"] = dest_data.get("Inv")
        alloc["dest_demand"] = dest_data.get("Target") # This is the demand you want
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

        # Run the rebalancing model once to get all necessary data
        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        # Get enriched, detailed recommendations
        detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, ddos_days, unfulfilled_shortages)
        
        # Get summary data from the same run and include it in the response
        summary_data = get_transfer_summary(allocations, shortages_excesses, transfer_info_map, ddos_days)
        
        # The client will now receive all data in a single payload
        return jsonify({
            "allocations": detailed_allocations, # Return the enriched data
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
        
        # FIX 1: run_rebalancer now returns 4 values, so we must unpack all 4.
        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        # FIX 2: get_transfer_details requires the new 'unfulfilled_shortages' argument.
        # FIX 3: Removed the redundant call to _enrich_allocations.
        detailed_allocations = get_transfer_details(allocations, shortages_excesses, transfer_info_map, ddos_days, unfulfilled_shortages)
        
        if not detailed_allocations: # Check against the detailed allocations list
            return jsonify({"message": "No data to download."}), 200

        # Convert the enriched data to CSV
        csv_data = convert_to_csv(detailed_allocations)
        
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
