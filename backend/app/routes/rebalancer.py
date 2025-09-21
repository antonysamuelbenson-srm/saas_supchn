from flask import Blueprint, request, jsonify, Response
from app.services.rebalancer_services import run_rebalancer, convert_to_csv, get_transfer_summary
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
    """
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)

        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        allocations = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        return jsonify({"allocations": allocations, "message": "Rebalancing completed successfully."}), 200

    except Exception as e:
        logger.error(f"An unhandled error occurred in the route: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500

@bp.route("/rebalance/download", methods=["POST"])
@role_required
def download_rebalancing_results():
    """
    API endpoint to download rebalancing recommendations as a CSV file.
    """
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)

        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        allocations = run_rebalancer(ddos_days)
        
        if "error" in allocations:
            return jsonify(allocations), 500

        csv_data = convert_to_csv(allocations)
        filename = f"rebalancing_recommendations_{date.today().strftime('%Y-%m-%d')}.csv"
        
        response = Response(csv_data, mimetype="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    except Exception as e:
        logger.error(f"An unhandled error occurred in the download route: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500
 

@bp.route("/rebalance/summary", methods=["POST"])
@role_required
def get_rebalancing_summary():
    """
    API endpoint to get a summary of rebalancing recommendations.
    """
    try:
        data = request.json or {}
        ddos_days = data.get("ddos_days", 28)
        
        if not isinstance(ddos_days, int) or ddos_days <= 0:
            return jsonify({"error": "ddos_days must be a positive integer."}), 400

        allocations = run_rebalancer(ddos_days)

        if "error" in allocations:
            return jsonify(allocations), 500
        
        summary = get_transfer_summary(allocations)
        
        return jsonify({"summary": summary, "message": "Rebalancing summary completed successfully."}), 200

    except Exception as e:
        logger.error(f"An unhandled error occurred in the summary route: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred."}), 500