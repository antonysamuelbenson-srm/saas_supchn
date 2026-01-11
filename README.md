- Changes in file

| 📁 File                    | 🛠️ Function/Logic             | 📄 Purpose                                                                                       |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `routes/upload.py`         | `validate_file()`              | ✔ Uploads CSV<br>✔ Validates format<br>✔ Stores in DB (`InventorySnapshot`)<br>✔ Triggers alerts |
| `utils/kpi_calc.py`        | `generate_alerts()`            | ✔ Checks each SKU<br>✔ Triggers `Stockout` or `BelowThreshold`<br>✔ Stores in `Alert` table      |
| `utils/threshold_calc.py`  | `update_reorder_config()`      | ✔ Calculates reorder\_point, safety stock, lead time<br>✔ Stores in `ReorderConfig`              |
| `routes/config.py`         | `recalc_thresholds()`          | ✔ API endpoint to trigger threshold calculations manually                                        |
| `models/reorder_config.py` | `ReorderConfig` model          | ✔ Stores threshold values per SKU                                                                |
| `routes/auth.py`           | `login()`, `register()`        | ✔ Handles user login and registration with `role`                                                |
| `utils/jwt_utils.py`       | `encode_jwt()`, `decode_jwt()` | ✔ Generates and validates JWT tokens for secure routes                                           |


- Tables used - 

| Table                | Stores                             |
| -------------------- | ---------------------------------- |
| `inventory_snapshot` | SKU stock per store (from CSV)     |
| `reorder_config`     | Thresholds like reorder point      |
| `alert`              | Generated alerts (stockouts, etc.) |
| `user`               | Login info and user roles          |



- update_reorder_config() Logic Summary

| **Step** | **Logic/Operation**                                                                  | **Purpose**                                  |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1️⃣      | Fetch all rows from `InventorySnapshot`                                              | To get current quantity data for each SKU    |
| 2️⃣      | Aggregate total quantity per SKU                                                     | Simulates total usage over 30 days           |
| 3️⃣      | Calculate average daily usage:<br>`avg_daily = total_qty / 30`                       | Assumes even usage across 30 days            |
| 4️⃣      | Compute safety stock:<br>`safety_stock = 0.5 * avg_daily`                            | Buffer to avoid stockouts                    |
| 5️⃣      | Set lead time:<br>`lead_time = 7`                                                    | Days to restock — fixed at 7 for now         |
| 6️⃣      | Calculate reorder point:<br>`reorder_point = (avg_daily × lead_time) + safety_stock` | Minimum quantity before reorder is triggered |
| 7️⃣      | Check if SKU already exists in `ReorderConfig`                                       | Update if it exists, else insert             |
| 8️⃣      | Save changes with `db.session.commit()`                                              | Stores computed thresholds into DB           |
| 9️⃣      | Return number of SKUs updated                                                        | Useful for logs/UI/monitoring                |


📦 What is a Reorder Point?
The Reorder Point is the inventory level at which you should place a new order to avoid running out of stock before the new supply arrives.

💡 Think of it as:
“When inventory drops to this level, it's time to restock.”

📐 Reorder Point Formula

reorder_point = (average_daily_usage × lead_time_days) + safety_stock


inventory table → current_inventory (sum of qty by store)
warehouse_max_data → max_capacity, target_level, safety_stock
↓
store_inventory_levels → auto-calculated percentages & categories

inventory_percentage = (current_inventory / max_capacity) * 100

target_level = GREATEST((max_capacity * 0.8)::integer, 100)

📊 Examples:
Max CapacityCalculationTarget LevelReason20002000 × 0.8 = 16001600Normal case15001500 × 0.8 = 12001200Normal case100100 × 0.8 = 80100Minimum applied5050 × 0.8 = 40100Minimum applied
🧠 Logic Behind 80%:
Why 80% of max capacity?

Buffer for demand spikes: 20% cushion for unexpected orders
Reorder timing: Gives time to restock before hitting capacity
Operational efficiency: Sweet spot between stock availability and storage costs
Safety margin: Prevents stockouts during supply delays


<br />

## Chatbot

### Switching between LLM providers

Configuring & Switching LLM Providers

This backend supports multiple LLM providers for SQL generation and NLP tasks:

* OpenAI : gpt-4o-mini
* Groq : llama-3.1-8b-instant
* Google Gemini : gemini-pro-latest

1. Set API Keys in .env
Add provider keys to the .env file:

env
```
LLM_PROVIDER=groq   # or "gemini" or "openai"

GROQ_API_KEY=groq_key
GEMINI_API_KEY=gemini_key
OPENAI_API_KEY=openai_key
``` 

2. Switching Providers
To switch the active LLM provider, simply update the LLM_PROVIDER value in .env file:

env
```
LLM_PROVIDER=groq
```
or

env
```
LLM_PROVIDER=gemini
```
or

env
```
LLM_PROVIDER=openai
```

3. How It Works
The provider is automatically selected at runtime based on the LLM_PROVIDER environment variable.

The logic resides in:
app/services/llm_providers/__init__.py

```
from app.config import LLM_PROVIDER

if LLM_PROVIDER == "gemini":
    from .gemini import call_llm
elif LLM_PROVIDER == "groq":
    from .groq import call_llm
elif LLM_PROVIDER == "openai":
    from .openai_llm import call_llm
else:
    raise ValueError(f"Unsupported LLM: {LLM_PROVIDER}")
```
Whichever provider is set in .env becomes active instantly upon server restart

### In order to update the knowledge base
* make necessary change in backend/app/knowledge
* run the following command to ingest the updates in knowledge base to chroma db
  ```
  python -m app.knowledge.chroma_ingest
  ```
