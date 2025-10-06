from app.services.llm_providers import call_llm
from app.utils.sql_utils import execute_read_only_query, parse_postgres_error
from chromadb import PersistentClient
from flask import current_app
import os

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

def generate_and_execute_sql(user_query: str, max_retries=3) -> str:
    base_prompt = build_rag_prompt(user_query)
    last_error = None
    sql = ""

    for attempt in range(max_retries):
        try:
            if attempt == 0:
                sql = call_llm(base_prompt)
            else:
                correction_prompt = f"""
{build_rag_prompt(user_query)}

Previous SQL failed.
Your SQL: {sql}
ERROR: {last_error}

Fix the query. Output ONLY corrected SQL.
"""
                sql = call_llm(correction_prompt)

            current_app.logger.debug(f"Generated SQL (attempt {attempt + 1}): {sql}")
            result = execute_read_only_query(sql)
            return interpret_result(result, user_query)

        except Exception as e:
            last_error = parse_postgres_error(e) if "psycopg2" in str(type(e)) else str(e)
            if attempt == max_retries - 1:
                return f"Failed after {max_retries} attempts. Last error: {last_error}"

    return "Unable to process query."
