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

FULL_SCHEMA_NARRATIVE = """
--
-- INVENTORY MANAGEMENT SYSTEM - DETAILED SCHEMA NARRATIVE
-- 
-- Table: alert
-- DESCRIPTION: This table contains different kinds of alerts (excess, spike, understock, out of stock) with varying severity and messages.
-- COLUMNS: id, created_at, type, severity, message, sku, store_id (FK to store_data), role_user_id (FK to user).
-- ALERTS: STOCK_OUT (qty=0, High), UNDER_STOCK (qty<ROP, Medium), EXCESS (qty>max capacity/2xROP, Low), SPIKE (Demand spike).

-- Table: dashboard_metrics
-- DESCRIPTION: Stores **aggregated, high-level performance indicators (KPIs)**. All values are accumulated totals across the network.
-- COLUMNS: id, timestamp, **inventory_position** (total SKU count in all stores), **weeks_of_supply** (accumulated WOS), **projected_stockouts**, **fill_rate_probability**.
-- TRIGGER: Recalculated from the settings section.

-- Table: forecast_daily
-- DESCRIPTION: This is the **user-uploaded forecast data**. Used when the 'predict' table is empty.
-- COLUMNS: forecast_id, forecast_date, forecast_qty, sku, store_id, batch_id.

-- Table: forecast_log
-- DESCRIPTION: Metadata about **ML model prediction runs** (run_time, status, run_type, n_days).

-- Table: forecast_schedule
-- DESCRIPTION: Data regarding **scheduled runs** (frequency, time, day, prediction weeks).

-- Table: inventory
-- DESCRIPTION: Data regarding the **current inventory or what is at hand** for each SKU in each store.
-- COLUMNS: snapshot_id, snapshot_date, **qty** (amount of SKU present), **sku** (e.g., SKU1001), **product_name**, store_id (FK to store_data), role_user_id.

-- Table: predict
-- DESCRIPTION: **Predictions made by the ML model**. This is the primary source for forecast data.
-- COLUMNS: id, date, **store_id (maps to store_data.store_code)**, **product_id (maps to inventory.sku)**, **predicted** (demand prediction), actual (actual sales), forecast_log_id.

-- Table: products
-- DESCRIPTION: Lists **SKUs available in each store**. (Store ID against SKU).
-- COLUMNS: store_id, sku.

-- Table: reorder_config
-- DESCRIPTION: Configuration data used for reorder calculations **when no forecast data is available**.
-- COLUMNS: sku, avg_daily_usage, lead_time_days, safety_stock, reorder_point.

-- Table: roles
-- DESCRIPTION: Stores user roles (admin, editor, viewer).
-- COLUMNS: id, role.

-- Table: sales
-- DESCRIPTION: Stores **past daily sales** (historical units_sold).
-- COLUMNS: id, date, **store_id (maps to store_data.store_code)**, **sku (maps to inventory.sku)**, units_sold.

-- Table: store_data
-- DESCRIPTION: **Master data for all stores**. Used for mapping store codes and IDs.
-- COLUMNS: **store_id** (identifier), **store_code** (VARCHAR, used in predict/sales tables), name, address, city, country, state, capacity_units.

-- Table: total_store_data
-- DESCRIPTION: Stores **safety_stock_level** and **reorder_level** for each SKU at each store.
-- COLUMNS: sku, safety_stock_level, reorder_level, store_code.

-- Table: transfer_cost_data
-- DESCRIPTION: **Cost and lead time** associated with transferring SKUs between locations.
-- COLUMNS: id, start_location, end_location, transfer_cost, lead_time.

-- Table: upload_batch
-- DESCRIPTION: Tracks file uploads (who, when, what type: inventory, forecast, etc.) using role_user_id.

-- Table: user
-- DESCRIPTION: User authentication and preferences.
-- COLUMNS: role_user_id (PK), email, lookahead_days, role_id (FK to roles), active.

-- Table: warehouse_max_data
-- DESCRIPTION: Stores store capacity data. **warehouse_name is basically the store_name**.
-- COLUMNS: store_id, warehouse_name, max_capacity.

"""
