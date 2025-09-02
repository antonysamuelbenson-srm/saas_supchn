# app/utils/db.py
from app import db
import uuid
from datetime import datetime
from sqlalchemy import text
import pandas as pd

def get_db_connection():
    """Return a SQLAlchemy connection context manager."""
    return db.engine.begin()  # ensures commit/rollback automatically

def df_query(sql: str) -> pd.DataFrame:
    """Run raw SQL with SQLAlchemy connection and return pandas DataFrame."""
    with db.engine.begin() as conn:
        return pd.read_sql(sql, conn)

def create_forecast_log(n_days: int, trigger_type: str = "manual", status: str = "running") -> str:
    """Create a new forecast log entry and return its ID"""
    forecast_log_id = str(uuid.uuid4())
    now = datetime.now()
    
    # Based on your table structure from the screenshots
    sql = text("""
        INSERT INTO forecast_log (id, run_time, run_started_at, status, n_days)
        VALUES (:id, :run_time, :run_started_at, :status, :n_days)
    """)
    
    with get_db_connection() as conn:
        conn.execute(sql, {
            'id': forecast_log_id,
            'run_time': now,
            'run_started_at': now,
            'status': status,
            'n_days': n_days
        })
        conn.commit()
    
    return forecast_log_id

def update_forecast_log_status(forecast_log_id: str, status: str) -> None:
    """Update the status of a forecast log entry"""
    now = datetime.now()
    
    # Set run_completed_at only if status is completed or failed
    if status in ['completed', 'failed']:
        sql = text("""
            UPDATE forecast_log 
            SET status = :status, run_completed_at = :run_completed_at
            WHERE id = :forecast_log_id
        """)
        params = {
            'status': status,
            'run_completed_at': now,
            'forecast_log_id': forecast_log_id
        }
    else:
        sql = text("""
            UPDATE forecast_log 
            SET status = :status
            WHERE id = :forecast_log_id
        """)
        params = {
            'status': status,
            'forecast_log_id': forecast_log_id
        }
    
    with get_db_connection() as conn:
        conn.execute(sql, params)
        conn.commit()

def bulk_insert_predict(rows):
    """Insert multiple prediction rows with forecast_log_id"""
    sql = text("""
        INSERT INTO predict (store_id, product_id, date, predicted, created_at, forecast_log_id)
        VALUES (:store_id, :product_id, :date, :predicted, :created_at, :forecast_log_id)
        ON CONFLICT ON CONSTRAINT uq_predict_triplet
        DO UPDATE SET predicted = EXCLUDED.predicted,
                      created_at = EXCLUDED.created_at,
                      forecast_log_id = EXCLUDED.forecast_log_id
    """)
    
    with get_db_connection() as conn:
        conn.execute(sql, rows)
        conn.commit()
