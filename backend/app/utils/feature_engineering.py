import polars as pl
from datetime import timedelta

def ensure_minimum_history(df: pl.DataFrame, min_weeks: int = 12) -> pl.DataFrame:
    """
    Ensures at least `min_weeks` of data by backfilling weekly with earliest value.
    """
    if df.height >= min_weeks:
        return df

    earliest_val = df["units_sold"][0]
    while df.height < min_weeks:
        earliest_date = df["date"].min()
        new_row = pl.DataFrame({
            "date": [earliest_date - timedelta(weeks=1)],
            "units_sold": [earliest_val]
        })
        df = pl.concat([new_row, df]).sort("date")
    return df


def generate_features(df: pl.DataFrame, forecast_date) -> pl.DataFrame:
    """
    Generates features for weekly data (aligned with training).
    """
    df = ensure_minimum_history(df, min_weeks=12)

    row = {
        "week": int(forecast_date.isocalendar()[1]),
        "month": forecast_date.month,
        "year": forecast_date.year,
        "lag_1": df["units_sold"][-1],
        "lag_4": df["units_sold"][-4] if df.height >= 4 else df["units_sold"][-1],
        "lag_12": df["units_sold"][-12] if df.height >= 12 else df["units_sold"][-1],
        "roll_mean_4": df["units_sold"][-4:].mean(),
        "roll_mean_12": df["units_sold"][-12:].mean() if df.height >= 12 else df["units_sold"].mean()
    }

    return pl.DataFrame([row]).select([
        "week", "month", "year",
        "lag_1", "lag_4", "lag_12",
        "roll_mean_4", "roll_mean_12"
    ])

