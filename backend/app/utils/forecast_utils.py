import os
import joblib
import polars as pl
import numpy as np
from datetime import timedelta, datetime, date
from math import ceil
from app.models.sales import Sales
from app.models.predict import ForecastDaily
from app.utils.feature_engineering import ensure_minimum_history, generate_features

# ----------------------------
# 1️⃣ Load model at startup
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../utils/model.pkl")
model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
print(f"DEBUG: model loaded? {model is not None}")


# ----------------------------
# 2️⃣ Fetch sales history
# ----------------------------
def fetch_sales_history(store_id=None, product_id=None) -> pl.DataFrame:
    """Fetch weekly sales history as a Polars DataFrame with explicit date handling."""
    query = Sales.query
    if store_id:
        query = query.filter_by(store_id=store_id)
    if product_id:
        query = query.filter_by(product_id=product_id)

    records = query.order_by(Sales.date.asc()).all()
    if not records:
        return pl.DataFrame()

    # Ensure dates are Python datetime objects before creating Polars DataFrame
    data = []
    for r in records:
        record_date = r.date
        # Convert to datetime if it's a date
        if isinstance(record_date, date) and not isinstance(record_date, datetime):
            record_date = datetime.combine(record_date, datetime.min.time())
        elif not isinstance(record_date, datetime):
            # Handle other formats
            record_date = datetime.fromisoformat(str(record_date))
            
        data.append({"date": record_date, "units_sold": float(r.units_sold)})  # Ensure float
    
    return pl.DataFrame(data).sort("date")


def run_forecast_logic(store_id=None, product_id=None, n_weeks=4):
    """
    Generate week-level forecasts starting from TODAY (not last history date).
    """
    # If model not loaded, return zeros from today
    if not model:
        base_date = datetime.utcnow().date()
        return [{"date": base_date + timedelta(weeks=i), "forecast": 0.0} for i in range(1, n_weeks + 1)]
                
    # Fetch historical sales
    hist_df = fetch_sales_history(store_id, product_id)

    if hist_df.is_empty():
        hist_df = pl.DataFrame({
            "date": [datetime.utcnow() - timedelta(weeks=i) for i in range(12, 0, -1)],
            "units_sold": [0.0] * 12
        })
        
    hist_df = ensure_minimum_history(hist_df, min_weeks=12)
    hist_df = hist_df.with_columns(pl.col("units_sold").cast(pl.Float64))

    forecasts = []
    current = hist_df.clone()

    # Anchor forecast to today instead of history’s last date
    next_datetime = datetime.utcnow()

    for week_num in range(n_weeks):
        # Generate features for the given future date
        X_row = generate_features(current, next_datetime)
        X_row = X_row.fill_nan(0)

        try:
            y_hat = float(model.predict(X_row.to_pandas())[0])
        except Exception as e:
            print(f"Prediction failed for store {store_id}, product {product_id}: {e}")
            y_hat = 0.0
        
        forecasts.append({
            "date": next_datetime.date(),
            "forecast": float(y_hat)
        })
        
        # Append to history for iterative predictions
        current = pl.concat([current, pl.DataFrame({
            "date": [next_datetime],
            "units_sold": [float(y_hat)]
        })], how="vertical")

        # Move to next week
        next_datetime += timedelta(weeks=1)

    return forecasts


# ----------------------------
# 4️⃣ Optional metrics
# ----------------------------
def calculate_metrics(actual, predicted):
    """Compute MAPE & RMSE for forecast evaluation"""
    if len(actual) == 0 or len(predicted) == 0:
        return {"MAPE": None, "RMSE": None}

    actual = np.array(actual)
    predicted = np.array(predicted)
    actual = np.where(actual == 0, 1e-8, actual)  # avoid div by zero

    mape = np.mean(np.abs((actual - predicted) / actual)) * 100
    rmse = np.sqrt(np.mean((actual - predicted) ** 2))
    return {"MAPE": round(mape, 2), "RMSE": round(rmse, 2)}

# ----------------------------
# 5️⃣ Aggregate weekly for charts
# ----------------------------
def aggregate_weekly(df: pl.DataFrame, date_col="date", value_col="forecast"):
    """Aggregate daily/weekly data to week start totals."""
    if df.is_empty():
        return pl.DataFrame({
            "week_start": pl.Series([], dtype=pl.Date),
            "forecast_units": pl.Series([], dtype=pl.Float64)
        })

    df = df.with_columns([
        (pl.col(date_col) - pl.duration(days=pl.col(date_col).dt.weekday())).alias("week_start")
    ])
    return df.groupby("week_start").agg([
        pl.col(value_col).sum().alias("forecast_units")
    ]).sort("week_start")

def prepare_chart_data(store_id):
    """Fetch historical forecasts for charting"""
    history = ForecastDaily.query.filter_by(store_id=store_id).order_by(ForecastDaily.date).all()
    if not history:
        return []

    df = pl.DataFrame([
        {"date": h.date, "actual": h.actual, "predicted": h.predicted}
        for h in history
    ])
    return df.to_dicts()