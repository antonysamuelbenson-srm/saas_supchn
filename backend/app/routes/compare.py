from flask import Blueprint, request, jsonify
from app import db
from app.services.metrics_service import mape, smape, mae, rmse
from app.models.forecast_metrics import ForecastMetrics
import uuid
from app.db_connection import get_supabase_client

bp = Blueprint("compare", __name__)

@bp.route("/compare", methods=["GET"])
def compare_forecasts():
    try:
        # --- Parameters ---
        n_days = int(request.args.get("n_days", 7))
        level = request.args.get("level", "store")  # 'store' or 'store_sku'
        role_user_id = request.args.get("role_user_id")

        # Convert role_user_id to UUID
        try:
            role_user_uuid = uuid.UUID(role_user_id)
        except ValueError:
            return jsonify({"error": "Invalid role_user_id UUID"}), 400

        supabase = get_supabase_client()

        # --- 1. Fetch actual forecast data ---
        actuals_data = supabase.table("forecast_daily").select("*").execute().data
        history_data = supabase.table("forecast_history").select("*").execute().data

        # --- 2. Group data for comparison ---
        results = {}
        for record in actuals_data:
            key = (record["store_id"], record["sku"]) if level == "store_sku" else record["store_id"]
            results.setdefault(key, {
                "actuals": [],
                "history": [],
                "store_id": record["store_id"],
                "sku": record.get("sku")
            })
            results[key]["actuals"].append(record["forecast_qty"])

        for record in history_data:
            key = (record["store_id"], record["sku"]) if level == "store_sku" else record["store_id"]
            if key in results:
                results[key]["history"].append(record["forecast_qty"])

        # --- 3. Calculate metrics ---
        metrics_records = []
        for key, vals in results.items():
            if len(vals["actuals"]) == len(vals["history"]) and vals["actuals"]:
                mape_val = mape(vals["actuals"], vals["history"])
                smape_val = smape(vals["actuals"], vals["history"])
                mae_val = mae(vals["actuals"], vals["history"])
                rmse_val = rmse(vals["actuals"], vals["history"])

                metrics_record = {
                    "key": " | ".join([str(k) for k in key]) if isinstance(key, tuple) else str(key),
                    "role_user_id": str(role_user_uuid),
                    "level": level,
                    "store_id": vals["store_id"],  # keep bigint
                    "sku": vals["sku"],
                    "n_days": n_days,
                    "mape": mape_val,
                    "smape": smape_val,
                    "mae": mae_val,
                    "rmse": rmse_val
                }
                metrics_records.append(metrics_record)

                # Save to DB
                new_metric = ForecastMetrics(
                    role_user_id=role_user_uuid,
                    level=level,
                    store_id=vals["store_id"],  # bigint, no uuid.UUID()
                    sku=vals["sku"],
                    n_days=n_days,
                    mape=mape_val,
                    smape=smape_val,
                    mae=mae_val,
                    rmse=rmse_val
                )
                db.session.add(new_metric)

        db.session.commit()

        return jsonify(metrics_records), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
