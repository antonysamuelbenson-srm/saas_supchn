import psycopg2
import re
from sqlalchemy import create_engine
from app.config import DATABASE_URL

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

def parse_postgres_error(err: str) -> str:
    err = str(err)
    if "does not exist" in err:
        match = re.search(r'"([^"]+)"', err)
        return f"Column/table '{match.group(1)}' not found" if match else "Object not found"
    if "operator does not exist" in err:
        return "Type mismatch (e.g., text vs number)"
    return err.split('\n')[0][:150]
