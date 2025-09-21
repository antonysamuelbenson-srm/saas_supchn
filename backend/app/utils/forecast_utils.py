import polars as pl
import numpy as np
import logging
from datetime import timedelta, datetime
import lightgbm as lgb
from mlforecast import MLForecast
from mlforecast.lag_transforms import RollingMean
from app.utils.db import df_query

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

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

def train_model(train_df: pl.DataFrame) -> MLForecast:
    id_col, date_col, target_col = "unique_id", "date", "quantity_sold"
    for col in ["store_id", "sku"]:
        if train_df[col].dtype == pl.Utf8:
            mapping = {v: i for i, v in enumerate(train_df[col].unique().to_list())}
            train_df = train_df.with_columns(pl.col(col).replace(mapping).cast(pl.Int32).alias(col))
    models = {'pred': LGBMRegressorWrapper(verbosity=-1, num_leaves=512)}
    mf = MLForecast(models=models, freq='1d', lag_transforms={1: [RollingMean(window_size=7)]})
    mf.fit(train_df, id_col=id_col, time_col=date_col, target_col=target_col,
           static_features=["store_id", "sku"])
    return mf

def df_to_predict_rows(preds_df, forecast_log_id: str):
    """Convert predictions dataframe to rows for database insertion with forecast_log_id"""
    rows = []
    now = datetime.now()
    for row in preds_df.iter_rows(named=True):
        unique_id = row['unique_id']
        store_id, sku = unique_id.split('_', 1)  # sku → product_id in predict table
        rows.append({
            'store_id': store_id,
            'product_id': sku,              # NB: product_id = sku
            'date': row['date'],              # match DB and code: always 'date'
            'predicted': float(row['pred']),
            'created_at': now,
            'forecast_log_id': forecast_log_id
        })
    return rows
