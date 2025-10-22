
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
    return f'''
    You are an intelligent inventory assistant. Analyze the user's query and decide:

1. If it's a greeting, introduction, or conversational query -> respond naturally
2. If it's asking for inventory data, forecasts, metrics -> generate SQL
3. If you're unsure -> ask for clarification

AVAILABLE DATABASE SCHEMA:
{context}

**CRITICAL: YOU MUST ANALYZE THE USER'S NATURAL LANGUAGE QUERY AND INTELLIGENTLY MAP IT TO THE CORRECT TABLES AND COLUMNS**

SCHEMA UNDERSTANDING:
- **Inventory/Stock:** Use 'inventory' (bigint store_id)
- **Sales/Demand:** Use 'sales' or 'predict' (varchar store_code)
- **Store Bridge:** Use 'store_data' to join on store_id (bigint) OR store_code (varchar).
- **Forecast Fallback Priority:** predict -> forecast_daily -> reorder_config

**FEW-SHOT EXAMPLES (CRITICAL FOR COMPLEXITY):**

-- Example 1: Easy - Single Table Filter
Question: Show me all **stockout alerts** from the **last 7 days** with **'High' severity**.
Response:
SELECT created_at, message, sku, store_id
FROM alert
WHERE type = 'STOCK_OUT'
  AND severity = 'High'
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Example 2: Medium - Store ID Join (Bigint)
Question: List the current **inventory quantity** and the **store name** for **SKU 'SKU1005'**.
Response:
SELECT
    i.qty AS current_inventory,
    sd.name AS store_name
FROM inventory i
JOIN store_data sd ON i.store_id = sd.store_id
WHERE
    i.sku = 'SKU1005'
ORDER BY
    sd.name
LIMIT 100;

-- Example 3: Medium - Store Code Join (Varchar)
Question: What were the **units sold** for **SKU 'SKU1002'** on **2025-09-01** at the store named **'Urban Fresh Market'**?
Response:
SELECT
    s.units_sold
FROM sales s
JOIN store_data sd ON s.store_id = sd.store_code
WHERE
    s.sku = 'SKU1002'
    AND s.date = '2025-09-01'
    AND sd.name = 'Urban Fresh Market';

-- Example 4: Medium - Metric Alias (WOS)
Question: Calculate the **weeks of supply** for **SKU '167'** at the store with internal ID **SKU1003**.
Response:
SELECT weeks_of_supply
FROM weeks_of_supply
WHERE store_id = 167
  AND sku = 'SKU1003';

-- Example 5: Difficult - Cross-Identifier Join & Aggregation
Question: **Total** inventory **quantity** and **total units sold** for all products in the **'Karnataka'** region in **September 2025**.
Response:
WITH StoreCodes AS (
    SELECT store_id, store_code
    FROM store_data
    WHERE state IN ('Karnataka')
)
SELECT
    SUM(i.qty) AS total_inventory_qty,
    SUM(s.units_sold) AS total_units_sold
FROM StoreCodes sc
LEFT JOIN inventory i
    ON sc.store_id = i.store_id
LEFT JOIN sales s
    ON sc.store_code = s.store_id
    AND s.date BETWEEN '2025-09-01' AND '2025-09-30';


-- Example 6: Difficult - Forecast Fallback Logic (Level 1 -> Level 2)
Question: For store code **'STR002'** and **SKU 'SKU1003'** on **2025-11-15**, what is the **best available demand forecast**? If ML data is missing, use the user-uploaded value.
Response:
WITH RankedForecasts AS (
    SELECT
        p.predicted AS demand,
        1 AS priority -- predict is highest priority
    FROM predict p
    JOIN store_data sd ON p.store_id = sd.store_code
    WHERE p.store_id = 'STR002' AND p.product_id = 'SKU1003' AND p.date = '2025-11-15'
    UNION ALL
    SELECT
        fd.forecast_qty AS demand,
        2 AS priority -- forecast_daily is second priority
    FROM forecast_daily fd
    JOIN store_data sd ON fd.store_id = sd.store_id
    WHERE sd.store_code = 'STR002' AND fd.sku = 'SKU1003' AND fd.forecast_date = '2025-11-15'
)
SELECT demand
FROM RankedForecasts
ORDER BY priority
LIMIT 1;

-- Example 7: Difficult - Forecast Fallback Logic (Level 1 -> Level 3, including store name lookup)
Question: What is the **projected demand** for **SKU 'SKU1004'** on **2025-12-01** at store **'BudgetBazaar'**? Prioritize ML, then user forecast, otherwise, use the **average daily usage** from **reorder_config**.
Response:
WITH TargetStore AS (
    SELECT store_id, store_code
    FROM store_data
    WHERE name = 'BudgetBazaar'
),
RankedForecasts AS (
    SELECT
        p.predicted AS demand,
        1 AS priority -- ML Prediction
    FROM predict p
    JOIN TargetStore ts ON p.store_id = ts.store_code
    WHERE p.product_id = 'SKU1004' AND p.date = '2025-12-01'
    UNION ALL
    SELECT
        fd.forecast_qty AS demand,
        2 AS priority -- User Uploaded Forecast
    FROM forecast_daily fd
    JOIN TargetStore ts ON fd.store_id = ts.store_id
    WHERE fd.sku = 'SKU1004' AND fd.forecast_date = '2025-12-01'
    UNION ALL
    SELECT
        rc.avg_daily_usage AS demand,
        3 AS priority -- Fallback Configuration
    FROM reorder_config rc
    JOIN TargetStore ts ON rc.store_id = ts.store_id
    WHERE rc.sku = 'SKU1004'
)
SELECT demand
FROM RankedForecasts
ORDER BY priority
LIMIT 1;

-- Example 8: Difficult - Inferring from Definition (Projected Stockouts)
Question: Find all SKUs and stores where the **current inventory** is **less than** the **forecasted demand** for the **next 3 days** (using **predict** table, if available).
Response:
WITH CurrentInventory AS (
    SELECT store_id, sku, qty AS current_stock
    FROM inventory
),
FutureDemand AS (
    SELECT
        sd.store_id,
        p.product_id AS sku,
        SUM(p.predicted) AS three_day_forecast
    FROM predict p
    JOIN store_data sd ON p.store_id = sd.store_code
    WHERE p.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
    GROUP BY 1, 2
)
SELECT
    ci.sku,
    sd.name AS store_name,
    ci.current_stock,
    fd.three_day_forecast
FROM CurrentInventory ci
JOIN FutureDemand fd
    ON ci.store_id = fd.store_id AND ci.sku = fd.sku
JOIN store_data sd
    ON ci.store_id = sd.store_id
WHERE
    ci.current_stock < fd.three_day_forecast;

-- Example 9: Difficult - Rebalancer Analysis (Varchar Join)
Question: Which **SKUs** were **recommended for transfer** from **'QuickShop Central'** to **'Everyday Essentials'** on **2025-10-20** and what was the **associated transfer cost**?
Response:
SELECT
    r.product_name AS sku, -- Using product_name since the SKU column contains the name
    r.units,
    tcd.transfer_cost
FROM rebalancer r
-- Join to store_data to get the actual store code (varchar) for the source store name
JOIN store_data AS src_sd
    ON r.src_store_name = src_sd.name
-- Join to store_data to get the actual store code (varchar) for the destination store name
JOIN store_data AS dst_sd
    ON r.dst_store_name = dst_sd.name
-- Use LEFT JOIN to ensure transfers are returned even if cost data is missing
LEFT JOIN transfer_cost_data tcd
    ON src_sd.store_code = tcd.start_location
    AND dst_sd.store_code = tcd.end_location
WHERE
    r.created_at::date = '2025-10-20' -- CRITICAL FIX: Casts timestamp to date for comparison
    AND r.src_store_name = 'QuickShop Central'
    AND r.dst_store_name = 'Everyday Essentials';

-- Example 10: Difficult - Multi-Source Inventory & Metric (Mixed ID Join)
Question: For **SKU 'SKU1003'**, compare the **safety stock** from **reorder_config** with the **safety stock** from **total_store_data** for all stores in **Rajasthan**.
Response:
SELECT
    sd.name AS store_name,
    rc.safety_stock AS config_safety_stock,
    tsd.safety_stock_level AS total_store_safety_stock
FROM store_data sd
LEFT JOIN reorder_config rc
    ON sd.store_id = rc.store_id AND rc.sku = 'SKU1003' -- uses store_id (bigint)
LEFT JOIN total_store_data tsd
    ON sd.store_code = tsd.store_code AND tsd.sku = 'SKU1003' -- uses store_code (varchar)
WHERE
    sd.state = 'Rajasthan';

-- Example 11: Easy - Check Upload Batch
Question: What was the filename and upload time for the latest forecast batch uploaded by the user with email 'aqua@gmail.com'?
Response:
SELECT
    ub.original_filename,
    ub.effective_start_date
FROM upload_batch ub
JOIN "user" u
    ON ub.role_user_id = u.role_user_id
WHERE
    u.email = 'aqua@gmail.com' -- Filter by the user's email
    AND ub.batch_type = 'forecast'
ORDER BY
    ub.effective_start_date DESC
LIMIT 1;


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
Response:'''

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

# def generate_and_execute_sql(user_query: str, max_retries=3) -> str:
#     # Let the LLM decide if this needs SQL or is conversational
#     context = retrieve_context_from_chroma(user_query)
    
#     smart_prompt = build_smart_prompt(user_query)
#     response, input_tokens, output_tokens = call_llm(smart_prompt)
    
#     # Check if the response looks like SQL
#     if looks_like_sql(response):
#         try:
#             current_app.logger.debug(f"Generated SQL: {response}")
#             result = execute_read_only_query(response)
#             answer = interpret_result(result, user_query)
#             log_to_csv(user_query, context, response, input_tokens, output_tokens, answer=answer)
#             return answer
#         except Exception as e:
#             error_msg = parse_postgres_error(e) if "psycopg2" in str(type(e)) else str(e)
#             # Handle SQL errors with retries
#             return handle_sql_error(user_query, context, response, error_msg, input_tokens, output_tokens, max_retries)
#     else:
#         # It's a conversational response, log and return as-is
#         log_to_csv(user_query, context, "N/A (conversational)", input_tokens, output_tokens, answer=response)
#         return response

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
