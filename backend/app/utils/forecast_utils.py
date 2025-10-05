import polars as pl
import numpy as np
import logging
from datetime import timedelta, datetime
import lightgbm as lgb
from mlforecast import MLForecast
from mlforecast.lag_transforms import RollingMean
from app.utils.db import df_query

# --- NEW IMPORTS FOR SERIALIZATION ---
import pickle 
import os 
# ------------------------------------

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Define the path where the model will be saved. 
# It's best practice to use an environment variable or a configuration file.
MODEL_SAVE_PATH = os.environ.get("MODEL_PATH", "/home/zeal/Desktop/inventory-saas/duxz/backend/app/utils/model.pkl")

def load_sales_from_db(split_date=None):
    sql = "SELECT store_id, sku, date, units_sold FROM sales"
    if split_date:
        sql += f" WHERE date < '{split_date}'"
    df = pl.from_pandas(df_query(sql))
    # Standardize columns for processing
    df = df.rename({
        "date": "date",
        "units_sold": "quantity_sold"
    })
    return df

def load_products_from_db():
    sql = "SELECT store_id, sku FROM products"
    return pl.from_pandas(df_query(sql)).with_columns([
        pl.col("store_id").cast(pl.Utf8), pl.col("sku").cast(pl.Utf8)
    ])

def load_regressors_from_db():
    hol = pl.from_pandas(df_query("SELECT date, is_holiday FROM holidays")) \
            .with_columns(pl.col("date").cast(pl.Date),
                          pl.col("is_holiday").cast(pl.Int8))
    wth = pl.from_pandas(df_query("SELECT date, store_id, temperature FROM weather")) \
            .with_columns(pl.col("date").cast(pl.Date),
                          pl.col("store_id").cast(pl.Utf8))
    eco = pl.from_pandas(df_query(
        "SELECT date, fuel_price, cpi, unemployment FROM economic_indicators"
    )).with_columns(pl.col("date").cast(pl.Date))
    return hol, wth, eco

def preprocess(df: pl.DataFrame) -> pl.DataFrame:
    df = df.with_columns([
        pl.col("store_id").cast(pl.Utf8),
        pl.col("sku").cast(pl.Utf8),
        pl.col("date").cast(pl.Date),
        pl.col("quantity_sold").cast(pl.Float64)
    ])
    # unique_id used only for ML pipeline; keep sku as-is elsewhere
    return df.with_columns(
        pl.concat_str([pl.col("store_id"), pl.col("sku")], separator="_").alias("unique_id")
    )

def join_regressors_hist(df: pl.DataFrame) -> pl.DataFrame:
    hol, wth, eco = load_regressors_from_db()
    df = df.join(hol.rename({"date": "date"}), on="date", how="left") \
           .with_columns(pl.col("is_holiday").fill_null(0))
    df = df.join(wth.rename({"date": "date"}), on=["date", "store_id"], how="left")
    df = df.join(eco.rename({"date": "date"}), on="date", how="left")
    return df

def add_time_features(df: pl.DataFrame, date_col="date", id_col="unique_id"):
    df = df.with_columns(pl.col(date_col).cast(pl.Date))
    df = df.with_columns([
        pl.col(date_col).dt.month().alias("m"),
        (np.pi * 2 * pl.col(date_col).dt.month() / 12).sin().alias("month_sin"),
        (np.pi * 2 * pl.col(date_col).dt.month() / 12).cos().alias("month_cos"),
        (np.pi * 2 * pl.col(date_col).dt.week().clip(upper_bound=52) / 52).sin().alias("week_sin"),
        (np.pi * 2 * pl.col(date_col).dt.week().clip(upper_bound=52) / 52).cos().alias("week_cos"),
        (np.pi * 2 * pl.col(date_col).dt.weekday() / 7).sin().alias("day_sin"),
        (np.pi * 2 * pl.col(date_col).dt.weekday() / 7).cos().alias("day_cos"),
    ]).drop(["m"])
    return df

class LGBMRegressorWrapper(lgb.LGBMRegressor):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._feature_names_in = None
    @property
    def feature_names_in_(self):
        return self._feature_names_in
    @feature_names_in_.setter
    def feature_names_in_(self, value):
        self._feature_names_in = value

def encode_static_features(df: pl.DataFrame) -> tuple[pl.DataFrame, dict]:
    """Encodes store_id/sku to Int32 and returns the DataFrame and the mapping."""
    df_out = df.clone()
    mappings = {}
    for col in ["store_id", "sku"]:
        if df_out[col].dtype == pl.Utf8:
            unique_values = df_out[col].unique().to_list()
            mapping = {v: i for i, v in enumerate(unique_values)}
            mappings[col] = mapping

            df_out = df_out.with_columns(
                pl.col(col)
                .replace(mapping)
                .cast(pl.Int32)
                .alias(col)
            )
    return df_out, mappings

def train_model(train_df: pl.DataFrame) -> MLForecast:
    id_col, date_col, target_col = "unique_id", "date", "quantity_sold"
    
    # 1. Apply Encoding
    train_df, _ = encode_static_features(train_df) 
    
    # 2. Add your custom trigonometric date features
    train_df = train_df.with_columns([
        (np.pi * 2 * pl.col("date").dt.month() / 12).sin().alias("month_sin"),
        (np.pi * 2 * pl.col("date").dt.month() / 12).cos().alias("month_cos"),
        (np.pi * 2 * pl.col("date").dt.week().clip(upper_bound=52) / 52).sin().alias("week_sin"),
        (np.pi * 2 * pl.col("date").dt.week().clip(upper_bound=52) / 52).cos().alias("week_cos"),
        (np.pi * 2 * pl.col("date").dt.weekday() / 7).sin().alias("day_sin"),
        (np.pi * 2 * pl.col("date").dt.weekday() / 7).cos().alias("day_cos"),
    ])
    
    models = {'pred': LGBMRegressorWrapper(verbosity=-1, num_leaves=512)}
    
    # Create MLForecast with explicit static_features
    mf = MLForecast(
        models=models, 
        freq='1d', 
        lag_transforms={1: [RollingMean(window_size=7)]}
    )
    
    # Fit the model with EXPLICIT static_features parameter
    # Only store_id and sku are static; all other features are dynamic
    mf.fit(
        train_df, 
        id_col=id_col, 
        time_col=date_col, 
        target_col=target_col,
        static_features=['store_id', 'sku']  # <-- THIS IS THE FIX
    )
    
    # Store feature information
    if 'pred' in mf.models and hasattr(mf.models['pred'], 'feature_name_'):
        feature_names = mf.models['pred'].feature_name_
        logger.info(f"Trained model features: {feature_names}")
        mf._custom_feature_names = feature_names
    else:
        expected_features = [
            'is_holiday', 'temperature', 'fuel_price', 'cpi', 'unemployment',
            'month_sin', 'month_cos', 'week_sin', 'week_cos', 'day_sin', 'day_cos',
            'store_id', 'sku'
        ]
        mf._custom_feature_names = expected_features
        logger.info(f"Using auto-detected features: {expected_features}")
    
    return mf

# --- NEW FUNCTIONS (save_model, load_model, df_to_predict_rows remain the same) ---
def save_model(model: MLForecast):
    """Serializes and saves the trained model to disk."""
    with open(MODEL_SAVE_PATH, 'wb') as f:
        pickle.dump(model, f)
    logger.info(f"Model saved successfully to {MODEL_SAVE_PATH}")

def load_model() -> MLForecast:
    """Loads the trained model from disk."""
    if not os.path.exists(MODEL_SAVE_PATH):
        raise FileNotFoundError(f"Trained model not found at {MODEL_SAVE_PATH}. Please run the dedicated training job first.")
        
    with open(MODEL_SAVE_PATH, 'rb') as f:
        model = pickle.load(f)
    logger.info(f"Model loaded successfully from {MODEL_SAVE_PATH}")
    return model

def df_to_predict_rows(preds_df, forecast_log_id: str):
    """Convert predictions dataframe to rows for database insertion with forecast_log_id"""
    rows = []
    now = datetime.now()
    for row in preds_df.iter_rows(named=True):
        unique_id = row['unique_id']
        store_id, sku = unique_id.split('_', 1)  
        rows.append({
            'store_id': store_id,
            'product_id': sku,              
            'date': row['date'],              
            'predicted': float(row['pred']),
            'created_at': now,
            'forecast_log_id': forecast_log_id
        })
    return rows

def get_model_features(model: MLForecast) -> list:
    """Get the list of features the model expects"""
    if hasattr(model, 'features_order_'):
        return model.features_order_
    elif hasattr(model.ts, 'features_order'):
        return model.ts.features_order
    else:
        return []
