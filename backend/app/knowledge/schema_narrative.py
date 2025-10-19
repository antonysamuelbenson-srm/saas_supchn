DATABASE_SCHEMA = """
--
-- INVENTORY MANAGEMENT SYSTEM (Chatbot-Optimized Schema)
--
-- CORE TABLES (in scope): 
-- inventory, predict, forecast_daily, store_data, sales, reorder_config,
-- weeks_of_supply, dashboard_metrics, alert, rebalancer, transfer_cost_data,
-- user, roles, upload_batch, products, demand_trend, reorder_suggestions,
-- store_inventory_levels, total_store_data, warehouse_max_data,
-- availability_rate, chatbot_logs, query_logs, forecast_log, forecast_schedule
--
-- EXCLUDED TABLES: 
-- forecast_history, inventory_snapshot, weather, stores, leaderboard, 
-- forecast_metrics, economic_indicators, holidays
--
-- KEY RULES:
-- 1. Two store identifiers exist:
--    - store_data.store_id (bigint): system/internal ID
--    - store_data.store_code (varchar): business ID used in user-facing tables
-- 2. Forecast/demand priority: predict → forecast_daily → reorder_config
-- 3. All (store, sku, date) combinations are unique per table
-- 4. System schemas (auth, realtime, storage, vault) are ignored

-- Table: store_data (Master store registry)
-- PK: store_id
-- Columns: store_id (bigint), store_code (varchar, UNIQUE), name (text), address (text), 
--          city (varchar), state (varchar), country (varchar), capacity_units (numeric), 
--          role_user_id (uuid, FK to user)

-- Table: inventory (Current/historical stock levels)
-- PK: snapshot_id
-- Columns: snapshot_id (bigint), snapshot_date (date), qty (numeric), 
--          sku (varchar), store_id (bigint, FK to store_data.store_id), 
--          product_name (text), role_user_id (uuid, FK to user)

-- Table: sales (Historical daily sales)
-- PK: id
-- Columns: id (bigint), date (date), sku (varchar), 
--          store_id (varchar = store_data.store_code), units_sold (integer)

-- Table: predict (ML-based demand forecasts)
-- PK: id
-- Columns: id (bigint), date (date), store_id (varchar = store_data.store_code), 
--          product_id (varchar = sku), predicted (real), actual (real), 
--          forecast_log_id (uuid, FK to forecast_log)

-- Table: forecast_daily (User-uploaded forecasts)
-- PK: forecast_id
-- Columns: forecast_id (bigint), forecast_date (date), forecast_qty (bigint), 
--          sku (varchar), store_id (bigint, FK to store_data.store_id), 
--          batch_id (bigint, FK to upload_batch), role_user_id (uuid)

-- Table: reorder_config (Fallback demand & reorder rules)
-- PK: id
-- Columns: id (uuid), sku (varchar), store_id (bigint, FK to store_data.store_id), 
--          avg_daily_usage (double precision), lead_time_days (integer), 
--          safety_stock (double precision), reorder_point (double precision), 
--          role_user_id (uuid)

-- Table: weeks_of_supply (Precomputed supply metric)
-- PK: id
-- Columns: id (uuid), store_id (bigint, FK to store_data), sku (varchar), 
--          current_inventory (numeric), avg_weekly_demand (numeric), 
--          weeks_of_supply (numeric), category (varchar), role_user_id (uuid)

-- Table: dashboard_metrics (System-wide KPIs)
-- PK: id
-- Columns: id (uuid), timestamp (timestamp), inventory_position (integer), 
--          weeks_of_supply (double precision), projected_stockouts (integer), 
--          fill_rate_probability (real)

-- Table: alert (Stock/out-of-stock warnings)
-- PK: id
-- Columns: id (uuid), created_at (timestamp), type (varchar), severity (varchar), 
--          message (varchar), sku (text), store_id (bigint, FK to store_data), 
--          role_user_id (uuid, FK to user)

-- Table: rebalancer (Inventory transfer recommendations)
-- PK: id
-- Columns: 
--          id (bigint), 
--          created_at (timestamp),              -- The date/time the calculation was run. Use 'created_at::date' for date filtering.
--          arrival_date (date),                 -- The date the transfer is expected to arrive.
--          units (integer),                     -- Quantity recommended for transfer.
--
--          sku (varchar, CONTAINS PRODUCT NAME), 
--          product_name (varchar, CONTAINS PRODUCT NAME),
--
--          src_store_name (varchar, CONTAINS DISPLAY NAME, use for filtering), 
--          dst_store_name (varchar, CONTAINS DISPLAY NAME, use for filtering), 
--          src_store_code (varchar, MIRROR of src_store_name), -- DO NOT use for transfer_cost_data join
--          dst_store_code (varchar, MIRROR of dst_store_name), -- DO NOT use for transfer_cost_data join
--
--          src_current_inventory (integer),
--          dst_current_inventory (integer),
--          src_days_of_supply (double precision),
--          dst_days_of_supply (double precision),
--          src_daily_forecast (double precision),
--          dst_daily_forecast (double precision),
--          src_excess (integer),
--          dst_shortage (integer),
--          network_deficit (integer),
--          ddos_shortage (integer),
--          total_unfulfilled_shortage (integer)

-- CRITICAL RULE UPDATE FOR QUERY GENERATION:
-- The 'src_store_code' and 'dst_store_code' columns in this table contain the 
-- human-readable STORE NAME (e.g., 'Freshway MiniMart'), NOT the technical store code.
-- The actual transfer cost lookup (transfer_cost_data) MUST be resolved by joining 
-- these names back to store_data to get the true store_code.

-- Table: transfer_cost_data (Inter-store transfer costs)
-- PK: id
-- Columns: id (integer), start_location (varchar = store_code), 
--          end_location (varchar = store_code), transfer_cost (double precision), 
--          lead_time (integer)

-- Table: user (User accounts)
-- PK: role_user_id
-- Columns: role_user_id (uuid), email (varchar), lookahead_days (integer, default 7), 
--          role_id (bigint, FK to roles), active (boolean, default true)

-- Table: roles (User permissions)
-- PK: id
-- Columns: id (bigint), role (varchar, default 'viewer')

-- Table: upload_batch (Tracks forecast/inventory uploads)
-- PK: batch_id
-- Columns: batch_id (bigint), role_user_id (uuid), batch_type (enum), 
--          original_filename (text), uploaded_at (timestamp), 
--          effective_start_date (date), effective_end_date (date)

-- Table: products (SKU-store availability)
-- PK: id
-- Columns: id (bigint), store_id (bigint), sku (varchar), product_name (text)

-- Table: demand_trend (Precomputed demand insights)
-- PK: id
-- Columns: id (uuid), store_id (bigint, FK to store_data), sku (varchar), 
--          recent_actual_demand (numeric), forecasted_demand (numeric), 
--          demand_variance_pct (numeric), trend_category (varchar), 
--          lookback_days (int, default 30), forecast_horizon_days (int, default 14), 
--          last_updated (timestamptz), role_user_id (uuid)

-- Table: reorder_suggestions (Auto-generated reorder advice)
-- PK: id
-- Columns: id (bigint), created_at (timestamptz), store_id (integer → cast to bigint), 
--          sku (varchar), reorder_date (date), suggested_qty (integer), 
--          current_qty (integer), forecast_demand (integer), incoming_stock (integer), 
--          projected_inv (integer), lead_time_days (smallint), status (text)

-- Table: store_inventory_levels (Store capacity & stock status)
-- PK: id
-- Columns: id (bigint), store_id (bigint, FK to store_data), 
--          current_inventory (integer, default 0), max_capacity (integer), 
--          safety_stock (integer), inventory_percentage (numeric(5,2), computed), 
--          level_category (text, computed: 'Low'/'Medium'/'High'), 
--          last_updated (timestamptz)

-- Table: total_store_data (Per-store SKU business rules)
-- PK: id
-- Columns: id (integer), store_code (varchar, FK to store_data.store_code), 
--          sku (varchar), safety_stock_level (integer), reorder_level (integer)

-- Table: warehouse_max_data (Store capacity limits)
-- PK: store_id
-- Columns: store_id (bigint, PK), warehouse_name (varchar = store name), 
--          max_capacity (integer)

-- Table: forecast_log (ML forecast run metadata)
-- PK: id
-- Columns: id (uuid), run_time (timestamp), status (text, default 'running'), 
--          run_type (text, default 'manual'), n_days (smallint)

-- Table: forecast_schedule (Automated forecast jobs)
-- PK: id
-- Columns: id (uuid), store_id (varchar = store_code), product_id (varchar = sku), 
--          frequency (text), time_of_day (text), n_weeks (integer), 
--          day_of_week (varchar), created_at (timestamptz)

-- Table: availability_rate, chatbot_logs, query_logs
-- Purpose: Monitoring & telemetry (safe to query if asked)

--
-- CRITICAL JOIN RULES:
-- • inventory, weeks_of_supply, alert → JOIN store_data ON store_id (bigint)
-- • sales, predict, rebalancer → JOIN store_data ON store_code (varchar)
-- • forecast_daily → uses store_id (bigint); resolve via store_data first
--
-- FORECAST FALLBACK LOGIC (for a given store_code, sku, date):
-- 1. predict (source = 'ml')
-- 2. forecast_daily (source = 'user')
-- 3. reorder_config.avg_daily_usage (source = 'config')
--
-- Use UNION ALL + ORDER BY source priority to implement.
--
"""

FULL_SCHEMA_NARRATIVE = """
--
-- INVENTORY MANAGEMENT SYSTEM – DETAILED NARRATIVE FOR SQL ENGINE
--

-- STORE IDENTIFIERS:
-- The system uses two store identifiers:
--   • store_data.store_id (bigint): internal system ID, used in inventory, alert, etc.
--   • store_data.store_code (varchar): business-facing code, used in sales, predict, etc.
-- Always resolve store identity via store_data before joining across tables.

-- FORECAST HIERARCHY:
-- When demand is requested for (store, sku, date), use this priority:
--   1. predict.predicted → from ML model
--   2. forecast_daily.forecast_qty → user-uploaded
--   3. reorder_config.avg_daily_usage → static fallback (treated as 1-day demand)
-- Implement via UNION ALL with explicit source tagging and ORDER BY priority.

-- UNIQUENESS:
-- All time-series tables (inventory, sales, predict, forecast_daily) enforce at most
-- one row per (store, sku, date). Aggregations do not require deduplication.

-- USER CONTEXT:
-- Tables with role_user_id may be user-scoped, but unless specified, queries should
-- return system-wide data (i.e., ignore role_user_id filters by default).

-- METRIC DEFINITIONS:
-- • Weeks of Supply = current_inventory / NULLIF(avg_weekly_demand, 0)
-- • Projected Stockout = forecasted demand over lookahead_days > current inventory
-- • Fill Rate Probability = estimated % of demand fulfillable from on-hand stock

-- TABLE ROLES:
-- • Core operational tables: inventory, sales, predict, forecast_daily, reorder_config
-- • Optimization: rebalancer, transfer_cost_data
-- • Monitoring: alert, weeks_of_supply, dashboard_metrics, demand_trend
-- • Master data: store_data, products, total_store_data, warehouse_max_data
-- • User & audit: user, roles, upload_batch, query_logs

-- EXCLUSIONS:
-- The following tables are archived or unused and must not be referenced:
--   forecast_history, inventory_snapshot, weather, stores, leaderboard,
--   forecast_metrics, economic_indicators, holidays

-- This schema is sufficient to answer all inventory, forecasting, stockout,
-- transfer, and KPI-related questions with precision.
--
"""
