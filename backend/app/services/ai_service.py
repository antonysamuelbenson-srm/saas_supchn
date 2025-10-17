from sqlalchemy import text
from app.utils.sql_utils import engine
from app.services.llm_providers import call_llm
from app.utils.sql_utils import execute_read_only_query, parse_postgres_error, looks_like_sql
from chromadb import PersistentClient
from flask import current_app
from datetime import datetime
import csv
import os

from app.config import LLM_PROVIDER

# Ensure logs directory exists
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
            "final_answer", "error", "feedback"  
        ])

def retrieve_context_from_chroma(query: str) -> str:
    # Point to your existing chroma_db folder
    client = PersistentClient(path=os.path.join(os.getcwd(), "chroma_db"))
    collection = client.get_collection("inventory_docs")
    
    results = collection.query(
        query_texts=[query],
        n_results=6,  # Increased to get more schema context
        where={"type": {"$in": ["metric", "table", "view", "join_rule"]}}
    )
    
    if results["documents"] and results["documents"][0]:
        return "\n".join(results["documents"][0])
    return "No relevant context found."

def build_smart_prompt(user_query: str) -> str:
    context = retrieve_context_from_chroma(user_query)
    return f"""
You are an intelligent inventory assistant. Analyze the user's query and decide:

1. If it's a greeting, introduction, or conversational query -> respond naturally
2. If it's asking for inventory data, forecasts, metrics -> generate SQL
3. If you're unsure -> ask for clarification

AVAILABLE DATABASE SCHEMA:
{context}

**CRITICAL: YOU MUST ANALYZE THE USER'S NATURAL LANGUAGE QUERY AND INTELLIGENTLY MAP IT TO THE CORRECT TABLES AND COLUMNS**

SCHEMA UNDERSTANDING:
- Inventory data: Use 'inventory' table (current stock levels)
- Demand forecasts: Use 'predict' table (ML predictions) or 'forecast_daily' (user uploads)
- Store information: Use 'store_data' table (store details)
- Sales history: Use 'sales' table (past sales)
- Alerts: Use 'alert' table (system alerts)
- Metrics: Use 'dashboard_metrics' (aggregated KPIs)
- Supply metrics: Use 'weeks_of_supply' table

**IF THE QUERY REQUIRES DATA FROM THE DATABASE, OUTPUT ONLY SQL:**
- Intelligently choose the right tables based on the user's intent
- Use appropriate JOINs to connect related data
- Include relevant columns for context (store names, product names, dates)
- Add meaningful aggregations when appropriate (SUM, COUNT, AVG)
- Use WHERE clauses to filter based on user's request
- Include ORDER BY for sensible sorting
- Add LIMIT for large result sets
- End with semicolon
- No explanations

**IF THE QUERY IS CONVERSATIONAL, RESPOND NATURALLY:**

Question: {user_query}
Response:
"""

def interpret_result(result: dict, query: str) -> str:
    """Intelligently interpret SQL results and provide natural language summary"""
    rows = result["rows"]
    columns = result["columns"]
    
    if not rows:
        return "No data found for your query."

    # Use LLM to generate intelligent summary of the results
    summary_prompt = f"""
I executed a SQL query and got these results. Please provide a natural language summary that would be helpful for the user.

USER'S ORIGINAL QUESTION: {query}

QUERY RESULTS:
- Number of rows: {len(rows)}
- Columns: {', '.join(columns)}
- First few rows as example: {rows[:3] if len(rows) > 3 else rows}

Please provide a concise, helpful summary of what this data shows. Focus on:
1. What the main findings are
2. Any notable patterns or insights
3. Keep it conversational and easy to understand
4. If there are many rows, summarize the overall picture

Summary:
"""
    
    try:
        summary, _, _ = call_llm(summary_prompt)
        return summary.strip()
    except Exception as e:
        # Fallback to basic interpretation if LLM fails
        current_app.logger.error(f"Failed to generate intelligent summary: {e}")
        return generate_basic_interpretation(rows, columns, query)

def generate_basic_interpretation(rows, columns, query):
    """Fallback basic interpretation when LLM summary fails"""
    if len(rows) == 1 and len(rows[0]) == 1:
        val = rows[0][0]
        if isinstance(val, (int, float)):
            if "count" in query.lower() or "number" in query.lower():
                return f"There are {val} records matching your criteria."
            elif "rate" in query.lower() or "probability" in query.lower():
                return f"The result is {val:.2%}."
            else:
                return f"The value is {val}."
        return f"The result is {val}."
    
    # For multiple rows, provide a smart summary
    num_rows = len(rows)
    
    # Try to identify key columns for context
    summary_parts = []
    
    # Look for quantity/numeric columns to summarize
    numeric_cols = []
    for i, col in enumerate(columns):
        if any(keyword in col.lower() for keyword in ['qty', 'quantity', 'amount', 'count', 'units', 'predicted', 'forecast', 'sold', 'inventory']):
            if all(isinstance(row[i], (int, float)) for row in rows if row[i] is not None):
                numeric_cols.append((col, i))
    
    if numeric_cols:
        for col_name, col_idx in numeric_cols:
            values = [row[col_idx] for row in rows if row[col_idx] is not None]
            if values:
                total = sum(values)
                avg = total / len(values)
                summary_parts.append(f"total {col_name}: {total:.0f}, average: {avg:.1f}")
    
    # Look for date context
    date_col = next((c for c in columns if 'date' in c.lower() or 'time' in c.lower()), None)
    if date_col:
        date_idx = columns.index(date_col)
        dates = [row[date_idx] for row in rows if row[date_idx] is not None]
        if dates:
            min_date = min(dates)
            max_date = max(dates)
            summary_parts.append(f"period: {min_date} to {max_date}")
    
    summary_text = "; ".join(summary_parts)
    
    if summary_text:
        return f"I found {num_rows} records. {summary_text.capitalize()}."
    else:
        return f"I found {num_rows} records with columns: {', '.join(columns)}."

def log_to_csv(
    user_query: str,
    context: str,
    sql: str,
    input_tokens: int,
    output_tokens: int,
    answer: str = "",
    error: str = "",
    feedback: str = ""   # 👈 Optional new field
):
    with open(LOG_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
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
            safe(error),
            feedback  
        ])
        print("✅ DEBUG: Log entry written")

def log_to_db(
    user_query: str,
    context: str,
    sql: str,
    input_tokens: int,
    output_tokens: int,
    answer: str = "",
    error: str = "",
    feedback: str = None
):
    """Store chat interactions and feedback in a DB table (portable across Supabase/AWS)."""
    # Normalize feedback for consistency
    if feedback:
        feedback = feedback.lower().strip()
        if feedback not in ["up", "down"]:
            feedback = None  # ignore invalid values

    insert_sql = text("""
        INSERT INTO query_logs
        (timestamp, user_query, retrieved_context, generated_sql, input_tokens, output_tokens, final_answer, error, feedback)
        VALUES (:ts, :user_query, :context, :sql, :input_tokens, :output_tokens, :answer, :error, :feedback)
    """)
    with engine.begin() as conn:
        conn.execute(insert_sql, {
            "ts": datetime.utcnow(),
            "user_query": user_query,
            "context": context,
            "sql": sql,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "answer": answer,
            "error": error,
            "feedback": feedback
        })

    print("✅ DEBUG: Log entry stored in database.")

def update_feedback_in_db(user_query, feedback):
    """Update feedback for the most recent chat with the same query (PostgreSQL-safe)."""
    update_sql = text("""
        WITH latest AS (
            SELECT id
            FROM query_logs
            WHERE user_query = :user_query
            ORDER BY timestamp DESC
            LIMIT 1
        )
        UPDATE query_logs
        SET feedback = :feedback
        WHERE id IN (SELECT id FROM latest)
    """)
    with engine.begin() as conn:
        conn.execute(update_sql, {"feedback": feedback, "user_query": user_query})

def handle_sql_error(user_query: str, context: str, sql: str, error: str, input_tokens: int, output_tokens: int, max_retries: int) -> str:
    """Handle SQL errors with retry logic"""
    last_error = error
    
    for attempt in range(1, max_retries):
        try:
            correction_prompt = f"""
Previous SQL failed with error: {last_error}

SQL that failed: {sql}

User query: {user_query}

Database context: {context}

**CRITICAL INSTRUCTION:** ANALYZE THE SCHEMA CONTEXT and the ERROR. If the error indicates a data type incompatibility (e.g., UUID vs. BIGINT), you **MUST** generate a corrected query that uses **explicit type casting** (e.g., `column_name::text` or `CAST(column_name AS type)`).

Please analyze the error and generate a corrected SQL query that:
1. Uses the correct table and column names from the schema
2. Follows proper JOIN syntax
3. Handles any data type conversions needed
4. Uses the right filters and conditions

Output ONLY the corrected SQL:
"""
            sql, input_tokens, output_tokens = call_llm(correction_prompt)
            
            current_app.logger.debug(f"Generated SQL (retry attempt {attempt + 1}): {sql}")
            result = execute_read_only_query(sql)
            answer = interpret_result(result, user_query)
            
            # Log success after retry
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


def generate_and_execute_sql(user_query: str, max_retries=3) -> dict:
    """
    Returns a dict with all metadata for logging:
    {
        "response": str,             # AI natural language answer
        "retrieved_context": str,    # Chroma context
        "generated_sql": str,        # SQL generated or 'N/A' if conversational
        "input_tokens": int,
        "output_tokens": int
    }
    """
    context = retrieve_context_from_chroma(user_query)
    smart_prompt = build_smart_prompt(user_query)
    response_text, input_tokens, output_tokens = call_llm(smart_prompt)

    if looks_like_sql(response_text):
        try:
            current_app.logger.debug(f"Generated SQL: {response_text}")
            result = execute_read_only_query(response_text)
            answer = interpret_result(result, user_query)
            generated_sql = response_text
            log_to_csv(user_query, context, generated_sql, input_tokens, output_tokens, answer=answer)
        except Exception as e:
            error_msg = parse_postgres_error(e) if "psycopg2" in str(type(e)) else str(e)
            answer = handle_sql_error(user_query, context, response_text, error_msg, input_tokens, output_tokens, max_retries)
            generated_sql = response_text
    else:
        # Conversational response
        answer = response_text
        generated_sql = "N/A"
        log_to_csv(user_query, context, generated_sql, input_tokens, output_tokens, answer=answer)

    return {
        "response": answer,
        "retrieved_context": context,
        "generated_sql": generated_sql,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens
    }
