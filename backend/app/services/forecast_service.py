import polars as pl
import traceback
import logging
from datetime import datetime
from app.utils.forecast_utils import (
    load_sales_from_db, preprocess,
    join_regressors_hist, add_time_features, train_model,
    df_to_predict_rows, load_regressors_from_db
)
from app.utils.db import bulk_insert_predict, create_forecast_log, update_forecast_log_status

logger = logging.getLogger(__name__)

def run_manual_forecast(weeks: int) -> dict:
    forecast_log_id = None
    try:
        if weeks <= 0:
            raise ValueError("weeks must be > 0")
        h = weeks * 7
        logger.info(f"Running manual forecast for {h} days")

        forecast_log_id = create_forecast_log(
            n_days=h,
            status="running"
        )
        logger.info(f"Created forecast log entry: {forecast_log_id}")

        # 1. Load & preprocess historical data
        hist = preprocess(load_sales_from_db())
        logger.info(f"History loaded and preprocessed: {hist.shape}")

        hist = join_regressors_hist(hist)
        hist = add_time_features(hist, "date", "unique_id")
        hist = hist.sort(["unique_id", "date"])
        logger.info(f"History after features: {hist.shape}")

        # 2. Train MLForecast model
        model = train_model(hist)
        logger.info("Model trained")

        # 3. Build future dataframe
        future = model.make_future_dataframe(h=h)
        # For possible joins, split unique_id
        future = future.with_columns([
            pl.col("unique_id").str.split("_").list.get(0).alias("store_id"),
            pl.col("unique_id").str.split("_").list.get(1).alias("sku")
        ])
        logger.info(f"Future frame ready: {future.shape}")

        # 4. Load regressors from DB and join
        hol, wth, eco = load_regressors_from_db()
        future = future.join(
            hol.rename({"date": "date"}), on="date", how="left"
        ).with_columns(pl.col("is_holiday").fill_null(0))
        future = future.join(
            wth.rename({"date": "date"}), on=["date", "store_id"], how="left"
        )
        future = future.join(
            eco.rename({"date": "date"}), on="date", how="left"
        )
        future = future.with_columns([
            pl.col("temperature").fill_null(0.0),
            pl.col("fuel_price").fill_null(0.0),
            pl.col("cpi").fill_null(0.0),
            pl.col("unemployment").fill_null(0.0),
        ])
        future = add_time_features(future, date_col="date", id_col="unique_id")
        # Remove static features before predict
        future_for_pred = future.drop(["store_id", "sku"])
        logger.info(f"Future frame prepared for prediction: {future_for_pred.shape}")

        # 5. Predict
        preds = model.predict(h=h, X_df=future_for_pred)
        print("Prediction columns:", preds.columns) 
        logger.info(f"Predictions generated: {preds.shape}")

        # 6. Save predictions to DB with forecast_log_id
        rows = df_to_predict_rows(preds, forecast_log_id=forecast_log_id)
        if rows:
            bulk_insert_predict(rows)
            logger.info(f"Inserted {len(rows)} rows into predict table")

        update_forecast_log_status(forecast_log_id, "completed")
        logger.info(f"Forecast log {forecast_log_id} marked as completed")

        return {"h": h, "rows_written": len(rows), "forecast_log_id": forecast_log_id}

    except Exception as e:
        logger.error("Forecast failed: %s", e)
        if forecast_log_id:
            try:
                update_forecast_log_status(forecast_log_id, "failed")
                logger.info(f"Forecast log {forecast_log_id} marked as failed")
            except Exception as log_error:
                logger.error(f"Failed to update forecast log status: {log_error}")
        traceback.print_exc()
        raise
