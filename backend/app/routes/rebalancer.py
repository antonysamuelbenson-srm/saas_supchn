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
    """
    API endpoint to get rebalancing recommendations and return JSON.
    This single endpoint now returns both detailed and summary data.
    """
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
            "allocations": detailed_allocations,
            "summary": summary_data,
            "message": "Rebalancing completed successfully."
        }), 200

    except Exception as e:
        logger.error(f"An unhandled error occurred in the route: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500
