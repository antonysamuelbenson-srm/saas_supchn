
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


@bp.route("/rebalance", methods=["POST"])
@role_required
def get_rebalancing_recommendations():
    """API endpoint to get rebalancing recommendations and return JSON."""
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)

        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, code_to_name_map, sku_to_name_map, code_to_coords_map = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        detailed_allocations = get_transfer_details(
            allocations, shortages_excesses, transfer_info_map, ddos_days, 
            unfulfilled_shortages, code_to_name_map, sku_to_name_map 
        )
        
        summary_data = get_transfer_summary(
            allocations, shortages_excesses, transfer_info_map, ddos_days,
            code_to_name_map, sku_to_name_map, code_to_coords_map
        )
        
        return jsonify({
            "allocations": detailed_allocations,
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
        
        allocations, shortages_excesses, transfer_info_map, unfulfilled_shortages, code_to_name_map, sku_to_name_map = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        detailed_allocations = get_transfer_details(
            allocations, shortages_excesses, transfer_info_map, ddos_days, 
            unfulfilled_shortages, code_to_name_map, sku_to_name_map 
        )
        
        if not detailed_allocations: 
            return jsonify({"message": "No data to download."}), 200

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
