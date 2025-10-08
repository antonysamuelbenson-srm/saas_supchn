from app.services.llm_providers import call_llm
from app.utils.sql_utils import execute_read_only_query, parse_postgres_error
from chromadb import PersistentClient
from flask import current_app
from datetime import datetime
import csv
import os

from app.config import LLM_PROVIDER


# Ensure logs directory exists
# LOG_DIR = os.path.join(os.getcwd(), "logs")
LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
LOG_DIR = os.path.abspath(LOG_DIR) 
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "query_logs.csv")
print(f"📁 LOG_FILE path: {os.path.abspath(LOG_FILE)}")

try:
    with open(LOG_FILE, 'a') as f:
        pass
    print("✅ Can write to log file")
except Exception as e:
    print(f"❌ Cannot write to log file: {e}")

# Create CSV header if not exists
if not os.path.exists(LOG_FILE):
    with open(LOG_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", "llm_provider", "user_query", "retrieved_context",
             "generated_sql", "input_tokens", "output_tokens",
            "final_answer", "error"
        ])

def retrieve_context_from_chroma(query: str) -> str:
    # Point to your existing chroma_db folder
    client = PersistentClient(path=os.path.join(os.getcwd(), "chroma_db"))
    collection = client.get_collection("inventory_docs")
    
    results = collection.query(
        query_texts=[query],
        n_results=4,
        where={"type": {"$in": ["metric", "table", "view", "join_rule"]}}
    )
    
    if results["documents"] and results["documents"][0]:
        return "\n".join(results["documents"][0])
    return "No relevant context found."

def build_rag_prompt(user_query: str) -> str:
    context = retrieve_context_from_chroma(user_query)
    return f"""
You are an expert SQL assistant for an inventory system.

Relevant context from documentation:
{context}

Rules:
- Generate ONLY PostgreSQL SELECT queries
- Use tables: inventory, dashboard_metrics, forecast_unified, store_data, etc.
- Prefer forecast_unified over predict/forecast_daily
- inventory.store_id and forecast_unified.store_id are BIGINT
- predict.store_id matches store_data.store_code (VARCHAR)
- NEVER use SELECT *
- Output ONLY SQL, end with semicolon

Question: {user_query}
SQL:
"""

def interpret_result(result: dict, query: str) -> str:
    rows = result["rows"]
    if not rows:
        return "No data found for your query."
    if len(rows) == 1 and len(rows[0]) == 1:
        val = rows[0][0]
        if isinstance(val, float) and ("rate" in query or "probability" in query):
            return f"The result is {val:.2%}."
        return f"The result is {val}."
    return f"Returned {len(rows)} records. Example: {dict(zip(result['columns'], rows[0]))}"

def log_to_csv(
    user_query: str,
    context: str,
    sql: str,
    input_tokens: int,
    output_tokens: int,
    answer: str = "",
    error: str = ""
):
    with open(LOG_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Escape quotes and newlines for CSV safety
        safe = lambda s: str(s).replace('"', '""').replace('\n', ' ')
        writer.writerow([
            datetime.utcnow().isoformat(),
            LLM_PROVIDER,
            safe(user_query),
            safe(context),
            safe(sql),
            input_tokens,
            output_tokens,
            safe(answer),
            safe(error)
        ])
        print("✅ DEBUG: Log entry written")

def generate_and_execute_sql(user_query: str, max_retries=3) -> str:
    context = retrieve_context_from_chroma(user_query)
    base_prompt = f"""
You are an expert SQL assistant for an inventory system.

Relevant context from documentation:
{context}

Rules:
- Generate ONLY PostgreSQL SELECT queries
- Use tables: inventory, dashboard_metrics, forecast_unified, store_data, etc.
- Prefer forecast_unified over predict/forecast_daily
- inventory.store_id and forecast_unified.store_id are BIGINT
- predict.store_id matches store_data.store_code (VARCHAR)
- NEVER use SELECT *
- Output ONLY SQL, end with semicolon

Question: {user_query}
SQL:
"""

    last_error = None
    sql = ""
    input_tokens = output_tokens = 0

    for attempt in range(max_retries):
        try:
            if attempt == 0:
                sql, input_tokens, output_tokens = call_llm(base_prompt)
            else:
                correction_prompt = f"""
{base_prompt}

Previous SQL failed.
Your SQL: {sql}
ERROR: {last_error}

Fix the query. Output ONLY corrected SQL.
"""
                sql, input_tokens, output_tokens = call_llm(correction_prompt)

            current_app.logger.debug(f"Generated SQL (attempt {attempt + 1}): {sql}")
            result = execute_read_only_query(sql)
            answer = interpret_result(result, user_query)
            
            # ✅ LOG SUCCESS
            log_to_csv(
                user_query=user_query,
                context=context,
                sql=sql,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                answer=answer
            )
            return answer

        except Exception as e:
            last_error = parse_postgres_error(e) if "psycopg2" in str(type(e)) else str(e)
            if attempt == max_retries - 1:
                final_msg = f"Failed after {max_retries} attempts. Last error: {last_error}"
                # ✅ LOG FAILURE
                log_to_csv(
                    user_query=user_query,
                    context=context,
                    sql=sql,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    error=final_msg
                )
                return final_msg

    return "Unable to process query."
