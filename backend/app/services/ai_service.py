import requests
import json
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    print("WARNING: DATABASE_URL not found in environment variables.")

DATABASE_SCHEMA = """
--
-- INVENTORY MANAGEMENT SYSTEM (Condensed Schema for LLM)
--
-- Tables: inventory, predict, forecast_daily, store_data, dashboard_metrics, 
-- weeks_of_supply, warehouse_max_data, forecast_log, sales, rebalancer, 
-- transfer_cost_data, roles, user, alert
--

-- Table: inventory (Current and Historical Stock Quantities)
-- PK: snapshot_id
-- Columns: snapshot_id (bigint), snapshot_date (date), qty (numeric), sku (character varying), 
--          store_id (bigint, FK to store_data), product_name (text), role_user_id (uuid, FK to user)

-- Table: predict (Predicted and Actual Demand by Date/Store)
-- PK: id
-- Columns: id (bigint), date (date), store_id (character varying), product_id (character varying), 
--          predicted (real), actual (real), forecast_log_id (uuid, FK to forecast_log)

-- Table: forecast_daily (Daily Forecasts, uploaded by the user)
-- PK: forecast_id
-- Columns: forecast_id (bigint), forecast_date (date), forecast_qty (bigint), sku (character varying),
--          store_id (bigint), batch_id (bigint)

-- Table: store_data (Master Data for Store Locations/Attributes)
-- PK: store_id
-- Columns: store_id (bigint), name (text), store_code (character varying), address (text), 
--          city (character varying), state (character varying), country (character varying)

-- Table: dashboard_metrics (Aggregated, high-level performance indicators)
-- PK: id
-- Columns: id (uuid), timestamp (timestamp), inventory_position (integer), weeks_of_supply (double precision), 
--          projected_stockouts (integer), fill_rate_probability (real)

-- Table: weeks_of_supply (Calculated Supply Metric)
-- PK: id
-- Columns: id (uuid), store_id (bigint, FK to store_data), sku (character varying), 
--          current_inventory (numeric), avg_weekly_demand (numeric), weeks_of_supply (numeric), 
--          category (character varying)

-- Table: warehouse_max_data (Warehouse/Store Max Capacity)
-- PK: store_id
-- Columns: store_id (bigint), warehouse_name (character varying), max_capacity (integer)

-- Table: forecast_log (Metadata about Forecast Runs)
-- PK: id
-- Columns: id (uuid), run_time (timestamp), status (text, default 'running'), run_type (text, default 'manual'), 
--          n_days (smallint)

-- Table: sales (Daily Sales/Units Sold)
-- PK: id
-- Columns: id (bigint), date (date), sku (character varying), store_id (character varying), units_sold (integer)

-- Table: rebalancer (Suggested Inventory Transfers)
-- PK: id
-- Columns: id (bigint), run_date (date), src_store (character varying), dst_store (character varying), 
--          sku (character varying), units (real), objective_value (real), status (text)

-- Table: transfer_cost_data (Cost to move inventory between locations)
-- PK: id
-- Columns: id (integer), start_location (character varying), end_location (character varying), 
--          transfer_cost (double precision), lead_time (integer)

-- Table: roles (User Permissions/Role Definitions)
-- PK: id
-- Columns: id (bigint), role (character varying, default 'viewer')

-- Table: user (User Authentication and Preferences)
-- PK: role_user_id
-- Columns: role_user_id (uuid), email (character varying), lookahead_days (integer), 
--          role_id (bigint, FK to roles), active (boolean)

-- Table: alert (System Generated Alerts)
-- PK: id
-- Columns: id (uuid), created_at (timestamp), type (character varying), severity (character varying), 
--          message (character varying), sku (text), store_id (bigint, FK to store_data), 
--          role_user_id (uuid, FK to user)

--
-- RELATIONSHIPS / FOREIGN KEYS (Simplified map):
-- inventory.store_id -> store_data.store_id
-- inventory.role_user_id -> user.role_user_id
-- weeks_of_supply.store_id -> store_data.store_id
-- user.role_id -> roles.id
-- alert.store_id -> store_data.store_id
-- alert.role_user_id -> user.role_user_id
--
"""

def get_db_schema():
    """Returns the schema string for LLM context."""
    return DATABASE_SCHEMA

def call_ollama(prompt, system_message, is_json=True):
    """Sends a request to the Ollama API."""
    data = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": system_message,
        "format": "json" if is_json else "", # Only force JSON for SQL generation
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_URL, json=data)
        response.raise_for_status()
        
        raw_text = response.json().get('response', '').strip()
        
        if is_json:
            return json.loads(raw_text)
        return raw_text
    except Exception as e:
        print(f"Ollama API Error or JSON Decode Error: {e}")
        return None

def execute_sql(sql_query):
    """Executes the SQL query against the PostgreSQL database."""
    conn = None
    if not DB_URL:
        return None, None, "Database connection not configured (DATABASE_URL is missing)."
        
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        cursor.execute(sql_query)
        
        if cursor.description is not None:
            # Handle SELECT queries
            column_names = [desc[0] for desc in cursor.description]
            results = cursor.fetchall()
            return results, column_names, None 
        else:
            # Handle non-SELECT queries (if necessary)
            conn.commit()
            return "Success", None, None

    except psycopg2.Error as e:
        return None, None, str(e)
    finally:
        if conn:
            conn.close()


def run_agent(nl_query):
    """The main entry point for the Text-to-SQL logic."""
    # --- 1. Intent Check & SQL Generation ---
    system_prompt_gen = f"""
    You are an expert PostgreSQL Text-to-SQL translator for an inventory management system.
    
    Your goal is to accurately convert the user's question into a single, executable SQL query, or determine if no SQL is needed.
    
    DATABASE SCHEMA:
    {get_db_schema()}
    
    -- IMPORTANT RULES:
    -- 1. Use the EXACT table and column names from the schema above.
    -- 2. Use table aliases (e.g., SELECT T1.qty FROM inventory AS T1) for clarity, especially when joining.
    -- 3. Use INNER JOINs to link tables using the RELATIONSHIPS map provided in the schema.
    -- 4. Always filter by the MOST RECENT data (e.g., MAX(snapshot_date) in inventory) unless the user asks for historical data.
    -- 5. If the user asks for data by store NAME (e.g., 'Mall Outlet'), you must JOIN the relevant table with the 'store_data' table using 'store_id' to find the ID corresponding to the name.
    
    -- FEW-SHOT EXAMPLES (for complex logic):
    -- NL: What is the current inventory quantity for SKU 123 at the store named 'Main St'?
    -- SQL: SELECT T1.qty FROM inventory AS T1 JOIN store_data AS T2 ON T1.store_id = T2.store_id WHERE T1.sku = '123' AND T2.name = 'Main St' ORDER BY T1.snapshot_date DESC LIMIT 1;
    
    -- NL: Show me all stockout alerts.
    -- SQL: SELECT message, created_at FROM alert WHERE type = 'stockout' ORDER BY created_at DESC;

    -- NL: What is the projected stockouts metric from the dashboard?
    -- SQL: SELECT projected_stockouts FROM dashboard_metrics ORDER BY timestamp DESC LIMIT 1;

    -- NL: How many products are currently available in the Airport Kiosk?
    -- SQL: SELECT SUM(T1.qty) FROM inventory AS T1 JOIN store_data AS T2 ON T1.store_id = T2.store_id WHERE T2.name = 'Airport Kiosk' ORDER BY T1.snapshot_date DESC LIMIT 1;
    
    -- NL: What is the product name for SKU1002?
    -- SQL: SELECT product_name FROM inventory WHERE sku = 'SKU1002' ORDER BY snapshot_date DESC LIMIT 1;
    
    -- FINAL OUTPUT FORMAT:
    -- Analyze the user query. If it requires data, generate ONLY the SQL command. Otherwise, set 'generate_sql' to false.
    -- You MUST respond with a single JSON object.
    
    JSON STRUCTURE:
    {{
        "generate_sql": true, // or false
        "sql_query": "...", // The SQL query or an empty string
        "nl_intent": "{nl_query}"
    }}
    """
    
    llm_output = call_ollama(nl_query, system_prompt_gen, is_json=True)

    if llm_output is None:
        return {"error": "Internal error during intent analysis or Ollama connection."}, 500

    sql_needed = llm_output.get("generate_sql", False)
    sql_query = llm_output.get("sql_query", "").strip()
    
    if not sql_needed or not sql_query:
        # --- PATH 1: NO SQL NEEDED (General conversation) ---
        return generate_final_response(nl_query, None, None, is_sql_path=False)

    # --- PATH 2: SQL IS NEEDED (Execution and Refinement) ---
    max_attempts = 2
    for attempt in range(1, max_attempts + 1):
        result, columns, error = execute_sql(sql_query)
        
        if error is None:
            # SUCCESS
            return generate_final_response(nl_query, sql_query, result, is_sql_path=True)
        
        # Failure: Attempt self-correction
        if attempt < max_attempts:
            refinement_prompt = f"The user asked: '{nl_query}'. The SQL '{sql_query}' failed with the PostgreSQL error: '{error}'. Generate a corrected SQL query that fixes this error."
            
            refinement_output = call_ollama(refinement_prompt, system_prompt_gen, is_json=True)
            
            new_sql = refinement_output.get("sql_query", "").strip()
            if new_sql and new_sql != sql_query:
                sql_query = new_sql
                continue
            else:
                break
        else:
            # Max attempts reached or correction failed
            return generate_final_response(nl_query, sql_query, None, error=error, is_sql_path=True)

def generate_final_response(nl_query, sql_query, result, error=None, is_sql_path=False):
    """Uses the LLM to convert raw data, an error, or a general query into NL."""
    
    if is_sql_path:
        if error:
            final_prompt = f"The user asked: '{nl_query}'. The SQL failed with error: '{error}'. Explain the error and state you cannot answer."
            final_system = "You are a professional, empathetic chatbot. Keep the response brief."
        else:
            final_prompt = f"The user asked: '{nl_query}'. The raw data is: {result}. Convert this into a clear, concise, human-readable sentence. State if no data was found."
            final_system = "You are an expert data analyst. Synthesize raw data into a friendly natural language response."
    else:
        # General conversation 
        final_prompt = f"The user said: '{nl_query}'. Respond naturally to this conversational statement or question."
        final_system = "You are a friendly, conversational assistant. Do NOT mention data, the database, or your ability to find information. Keep your response brief, warm, and natural."
    
    final_response_text = call_ollama(final_prompt, final_system, is_json=False)
    
    if final_response_text is None:
        return {"response": "Sorry, an internal error occurred while formulating the final response."}
        
    return {"response": final_response_text}
