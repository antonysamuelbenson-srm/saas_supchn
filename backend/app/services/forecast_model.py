from app.utils.feature_engineering import prepare_features
from app.utils.model_io import load_model

def run_forecast(df):
    model = load_model()
    X = prepare_features(df)
    y_pred = model.predict(X)
    df["forecast"] = y_pred
    return df
