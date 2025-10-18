import psycopg2
import re
from sqlalchemy import create_engine
from app.config import DATABASE_URL

# Create SQLAlchemy engine - this is what ai_service.py needs
engine = create_engine(DATABASE_URL)

def get_db_connection():
    # Reuse your existing DB setup if you have one
    return psycopg2.connect(DATABASE_URL)

def execute_read_only_query(sql: str) -> dict:
    # Safety: enforce SELECT + LIMIT
    sql = sql.strip().rstrip(";")
    if not sql.upper().startswith("SELECT"):
        raise ValueError("Only SELECT allowed")
    if "LIMIT" not in sql.upper():
        sql += " LIMIT 1000"
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            cols = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            return {"columns": cols, "rows": rows}

def parse_postgres_error(e) -> str:
    error_str = str(e)
    if "forecast_unified" in error_str:
        return "The forecast_unified view doesn't exist. Use predict and forecast_daily tables directly."
    elif "permission denied" in error_str.lower():
        return "Database permission error. Check if the view/table exists."
    elif "does not exist" in error_str:
        # Extract the missing object name
        match = re.search(r"relation \"([^\"]+)\"", error_str)
        if match:
            return f"Table/view '{match.group(1)}' doesn't exist. Check schema documentation."
    return error_str

def looks_like_sql(text: str) -> bool:
    """Heuristic to check if LLM output is SQL"""
    text_upper = text.strip().upper()
    sql_indicators = ['SELECT ', 'FROM ', 'WHERE ', 'JOIN ', 'GROUP BY ', 'ORDER BY ']
    return any(indicator in text_upper for indicator in sql_indicators) and ';' in text