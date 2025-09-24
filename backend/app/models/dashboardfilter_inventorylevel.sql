-- =====================================================
-- FUNCTIONS TO HANDLE AUTO-UPDATES
-- =====================================================

-- Function to recalculate inventory for specific store(s)
CREATE OR REPLACE FUNCTION recalculate_store_inventory(target_store_id bigint DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Update existing records
  WITH latest_inventory AS (
    SELECT 
      store_id,
      SUM(qty) as total_inventory
    FROM public.inventory i1
    WHERE snapshot_date = (
      SELECT MAX(snapshot_date) 
      FROM public.inventory i2 
      WHERE i2.store_id = i1.store_id
    )
    AND (target_store_id IS NULL OR store_id = target_store_id)
    GROUP BY store_id
  )
  UPDATE public.store_inventory_levels sil
  SET 
    current_inventory = COALESCE(li.total_inventory::integer, 0),
    last_updated = NOW()
  FROM latest_inventory li
  WHERE sil.store_id = li.store_id
  AND (target_store_id IS NULL OR sil.store_id = target_store_id);

  -- Insert new records for stores that don't exist in store_inventory_levels
  INSERT INTO public.store_inventory_levels (
    store_id, 
    current_inventory, 
    max_capacity, 
    target_level, 
    safety_stock
  )
  SELECT 
    wmd.store_id,
    COALESCE(inv_summary.total_inventory, 0)::integer,
    wmd.max_capacity,
    GREATEST((wmd.max_capacity * 0.8)::integer, 100),
    GREATEST((wmd.max_capacity * 0.2)::integer, 50)
  FROM public.warehouse_max_data wmd
  LEFT JOIN (
    SELECT 
      store_id, 
      SUM(qty) as total_inventory
    FROM public.inventory i1
    WHERE snapshot_date = (
      SELECT MAX(snapshot_date) 
      FROM public.inventory i2 
      WHERE i2.store_id = i1.store_id
    )
    AND (target_store_id IS NULL OR store_id = target_store_id)
    GROUP BY store_id
  ) inv_summary ON wmd.store_id = inv_summary.store_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.store_inventory_levels sil 
    WHERE sil.store_id = wmd.store_id
  )
  AND (target_store_id IS NULL OR wmd.store_id = target_store_id);

  -- Update max_capacity, target_level, safety_stock from warehouse_max_data changes
  UPDATE public.store_inventory_levels sil
  SET 
    max_capacity = wmd.max_capacity,
    target_level = GREATEST((wmd.max_capacity * 0.8)::integer, 100),
    safety_stock = GREATEST((wmd.max_capacity * 0.2)::integer, 50),
    last_updated = NOW()
  FROM public.warehouse_max_data wmd
  WHERE sil.store_id = wmd.store_id
  AND (target_store_id IS NULL OR sil.store_id = target_store_id);

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Trigger function for inventory table changes
CREATE OR REPLACE FUNCTION trigger_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT, UPDATE, DELETE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_store_inventory(NEW.store_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_store_inventory(OLD.store_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for warehouse_max_data changes
CREATE OR REPLACE FUNCTION trigger_warehouse_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM recalculate_store_inventory(NEW.store_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove the corresponding inventory level record
    DELETE FROM public.store_inventory_levels WHERE store_id = OLD.store_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_inventory_auto_update ON public.inventory;
DROP TRIGGER IF EXISTS trigger_warehouse_auto_update ON public.warehouse_max_data;

-- Trigger for inventory table changes
CREATE TRIGGER trigger_inventory_auto_update
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION trigger_inventory_change();

-- Trigger for warehouse_max_data changes
CREATE TRIGGER trigger_warehouse_auto_update
  AFTER INSERT OR UPDATE OR DELETE ON public.warehouse_max_data
  FOR EACH ROW
  EXECUTE FUNCTION trigger_warehouse_change();

-- =====================================================
-- BATCH UPDATE FUNCTION (for bulk operations)
-- =====================================================

-- Function for bulk updates when you want to avoid individual triggers
CREATE OR REPLACE FUNCTION batch_recalculate_all_stores()
RETURNS void AS $$
BEGIN
  -- Temporarily disable triggers for bulk operations
  SET session_replication_role = replica;
  
  -- Clear existing data
  TRUNCATE public.store_inventory_levels;
  
  -- Repopulate with fresh data
  INSERT INTO public.store_inventory_levels (
    store_id, 
    current_inventory, 
    max_capacity, 
    target_level, 
    safety_stock
  )
  SELECT 
    wmd.store_id,
    COALESCE(inv_summary.total_inventory, 0)::integer,
    wmd.max_capacity,
    GREATEST((wmd.max_capacity * 0.8)::integer, 100),
    GREATEST((wmd.max_capacity * 0.2)::integer, 50)
  FROM public.warehouse_max_data wmd
  LEFT JOIN (
    SELECT 
      store_id, 
      SUM(qty) as total_inventory
    FROM public.inventory i1
    WHERE snapshot_date = (
      SELECT MAX(snapshot_date) 
      FROM public.inventory i2 
      WHERE i2.store_id = i1.store_id
    )
    GROUP BY store_id
  ) inv_summary ON wmd.store_id = inv_summary.store_id;
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL POPULATION (run this once)
-- =====================================================

-- Populate the table initially
SELECT recalculate_store_inventory();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if triggers are active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table IN ('inventory', 'warehouse_max_data');

-- Test the auto-update (you can run this to verify triggers work)
/*
-- Example: Insert test inventory record
INSERT INTO public.inventory (store_id, sku, qty, product_name, snapshot_date)
VALUES (167, 'TEST_SKU', 100, 'Test Product', CURRENT_DATE);

-- Check if store_inventory_levels updated automatically
SELECT * FROM public.store_inventory_levels WHERE store_id = 167;

-- Clean up test
DELETE FROM public.inventory WHERE sku = 'TEST_SKU';
*/

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Function to check trigger performance
CREATE OR REPLACE FUNCTION check_inventory_sync_status()
RETURNS TABLE(
  store_id bigint,
  store_name text,
  inventory_last_snapshot date,
  levels_last_updated timestamptz,
  sync_lag_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sil.store_id,
    sd.name as store_name,
    latest_snap.latest_date as inventory_last_snapshot,
    sil.last_updated as levels_last_updated,
    ROUND(EXTRACT(EPOCH FROM (NOW() - sil.last_updated))/3600, 2) as sync_lag_hours
  FROM public.store_inventory_levels sil
  JOIN public.store_data sd ON sil.store_id = sd.store_id
  LEFT JOIN (
    SELECT 
      store_id, 
      MAX(snapshot_date) as latest_date
    FROM public.inventory 
    GROUP BY store_id
  ) latest_snap ON sil.store_id = latest_snap.store_id
  ORDER BY sync_lag_hours DESC;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- SELECT * FROM check_inventory_sync_status();
-- SELECT batch_recalculate_all_stores(); -- For bulk refresh
-- SELECT recalculate_store_inventory(167); -- For single store refresh