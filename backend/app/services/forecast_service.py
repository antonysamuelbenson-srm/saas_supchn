import polars as pl
import numpy as np
import traceback
import logging
from datetime import datetime
from app.utils.forecast_utils import (
    load_sales_from_db, preprocess,
    join_regressors_hist, add_time_features, 
    train_model, df_to_predict_rows, 
    load_regressors_from_db,
    save_model, load_model, encode_static_features
)
from app.utils.db import bulk_insert_predict, create_forecast_log, update_forecast_log_status

logger = logging.getLogger(__name__)

# --- DEDICATED TRAINING AND SAVE FUNCTION ---
def run_full_training_and_save():
    """Runs a full model training, saves the artifact, and logs the process."""
    forecast_log_id = None
    try:
        logger.info("Starting dedicated full model training and save.")
        
        forecast_log_id = create_forecast_log(n_days=0, status="training")

        hist = preprocess(load_sales_from_db())
        hist = join_regressors_hist(hist)
        hist = add_time_features(hist, "date", "unique_id")
        
        hist = hist.sort(["unique_id", "date"])
        logger.info(f"History loaded and preprocessed: {hist.shape}")

        model = train_model(hist)
        logger.info("Model trained.")
        
        save_model(model)
        
        update_forecast_log_status(forecast_log_id, "completed_training")
        logger.info(f"Training log {forecast_log_id} completed.")
        return {"status": "ok", "message": "Model trained and saved.", "forecast_log_id": forecast_log_id}

    except Exception as e:
        logger.error("Full training failed: %s", e)
        if forecast_log_id:
            try:
                update_forecast_log_status(forecast_log_id, "failed_training")
            except Exception as log_error:
                logger.error(f"Failed to update forecast log status: {log_error}")
        traceback.print_exc()
        raise

def run_manual_forecast(weeks: int) -> dict:
    forecast_log_id = None
    try:
        if weeks <= 0:
            raise ValueError("weeks must be > 0")
        h = weeks * 7
        logger.info(f"Running manual INFERENCE for {h} days")

        forecast_log_id = create_forecast_log(n_days=h, status="inference_running")
        logger.info(f"Created forecast log entry: {forecast_log_id}")

        # 1. LOAD MODEL 
        model = load_model()
        logger.info("Model loaded for inference.")
        
        # 2. Build future dataframe
        future = model.make_future_dataframe(h=h) 
        
        # 3. Split unique_id for joins
        future = future.with_columns([
            pl.col("unique_id").str.split("_").list.get(0).alias("store_id"),
            pl.col("unique_id").str.split("_").list.get(1).alias("sku")
        ])
        logger.info(f"Future frame ready: {future.shape}")

        # 4. Load regressors and join
        hol, wth, eco = load_regressors_from_db()
        
        # Join holidays (using 'date' column)
        future = future.join(
            hol, on="date", how="left"
        ).with_columns(pl.col("is_holiday").fill_null(0))
        
        # Join weather
        future = future.join(
            wth, on=["date", "store_id"], how="left"
        )
        
        # Join economic indicators
        future = future.join(
            eco, on="date", how="left"
        )
        
        # Apply encoding to future data
        future, _ = encode_static_features(future)
        
        # Fill nulls appropriately
        future = future.with_columns([
            pl.col("temperature").fill_null(0.0),
            pl.col("fuel_price").fill_null(0.0),
            pl.col("cpi").fill_null(0.0),
            pl.col("unemployment").fill_null(0.0),
        ])
       
        # Add time features (using 'date' column)
        future = future.with_columns([
            (np.pi * 2 * pl.col("date").dt.month() / 12).sin().alias("month_sin"),
            (np.pi * 2 * pl.col("date").dt.month() / 12).cos().alias("month_cos"),
            (np.pi * 2 * pl.col("date").dt.week().clip(upper_bound=52) / 52).sin().alias("week_sin"),
            (np.pi * 2 * pl.col("date").dt.week().clip(upper_bound=52) / 52).cos().alias("week_cos"),
            (np.pi * 2 * pl.col("date").dt.weekday() / 7).sin().alias("day_sin"),
            (np.pi * 2 * pl.col("date").dt.weekday() / 7).cos().alias("day_cos"),
        ])
        
        logger.info(f"Future columns: {future.columns}")
        logger.info(f"Future frame prepared for prediction: {future.shape}")
        logger.info(f"Future frame sample:\n{future.head()}")

        # 5. Predict
        # For static features (store_id, sku), we only pass dynamic features in X_df
        # Static features are already stored in the model from training
        dynamic_features = ['unique_id', 'date', 'is_holiday', 'temperature', 'fuel_price', 
                           'cpi', 'unemployment', 'month_sin', 'month_cos', 
                           'week_sin', 'week_cos', 'day_sin', 'day_cos']
        future_dynamic = future.select([col for col in dynamic_features if col in future.columns])
        
        logger.info(f"Passing dynamic features to predict: {future_dynamic.columns}")
        preds = model.predict(h=h, X_df=future_dynamic)
        logger.info(f"Predictions generated: {preds.shape}")
        logger.info(f"Prediction columns: {preds.columns}")

        # 6. Save predictions to DB
        rows = df_to_predict_rows(preds, forecast_log_id=forecast_log_id)
        if rows:
            bulk_insert_predict(rows)
            logger.info(f"Inserted {len(rows)} rows into predict table")

        update_forecast_log_status(forecast_log_id, "completed")
        logger.info(f"Forecast log {forecast_log_id} marked as completed")

        return {"h": h, "rows_written": len(rows), "forecast_log_id": forecast_log_id}

    except Exception as e:
        logger.error(f"Inference failed: {str(e)}")
        logger.error(traceback.format_exc())
        if forecast_log_id:
            try:
                update_forecast_log_status(forecast_log_id, "failed")
                logger.info(f"Forecast log {forecast_log_id} marked as failed")
            except Exception as log_error:
                logger.error(f"Failed to update forecast log status: {log_error}")
        raise
