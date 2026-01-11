from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DemandTrendService:
    
    # Configurable thresholds
    STABLE_TOLERANCE_PCT = 10  # ±10% is considered stable
    
    @staticmethod
    def calculate_and_refresh(lookback_days=30, forecast_horizon_days=14):
        """Calculate and update demand trends for all SKUs"""
        from app import db
        
        try:
            query = """
            WITH recent_sales AS (
                SELECT 
                    sd.store_id,
                    s.sku,
                    SUM(s.units_sold) as total_actual_sales
                FROM sales s
                INNER JOIN store_data sd 
                    ON (s.store_id = sd.store_code OR s.store_id::TEXT = sd.store_id::TEXT)
                WHERE s.date >= CURRENT_DATE - INTERVAL ':lookback days'
                    AND s.units_sold > 0
                GROUP BY sd.store_id, s.sku
            ),
            forecast_data AS (
                SELECT 
                    sd.store_id as store_id,
                    p.product_id as sku,
                    SUM(p.predicted) as total_forecasted
                FROM predict p
                INNER JOIN store_data sd 
                    ON (p.store_id = sd.store_code OR p.store_id::TEXT = sd.store_id::TEXT)
                WHERE p.date >= CURRENT_DATE 
                    AND p.date < CURRENT_DATE + INTERVAL ':horizon days'
                    AND p.predicted > 0
                GROUP BY sd.store_id, p.product_id
            ),
            combined_data AS (
                SELECT 
                    COALESCE(rs.store_id, fd.store_id) as store_id,
                    COALESCE(rs.sku, fd.sku) as sku,
                    COALESCE(rs.total_actual_sales, 0) as recent_actual,
                    COALESCE(fd.total_forecasted, 0) as forecasted,
                    CASE 
                        WHEN COALESCE(rs.total_actual_sales, 0) = 0 THEN NULL
                        ELSE ROUND(
                            ((COALESCE(fd.total_forecasted, 0) - COALESCE(rs.total_actual_sales, 0)) 
                            / NULLIF(rs.total_actual_sales, 0) * 100)::NUMERIC, 2
                        )
                    END as variance_pct
                FROM recent_sales rs
                FULL OUTER JOIN forecast_data fd 
                    ON rs.store_id = fd.store_id AND rs.sku = fd.sku
                WHERE COALESCE(rs.total_actual_sales, 0) > 0 
                    OR COALESCE(fd.total_forecasted, 0) > 0
            )
            INSERT INTO demand_trend 
                (store_id, sku, recent_actual_demand, forecasted_demand, 
                 demand_variance_pct, trend_category, lookback_days, 
                 forecast_horizon_days, role_user_id)
            SELECT 
                cd.store_id,
                cd.sku,
                cd.recent_actual,
                cd.forecasted,
                COALESCE(cd.variance_pct, 0),
                CASE 
                    WHEN cd.variance_pct IS NULL THEN 'Unknown'
                    WHEN cd.variance_pct > :stable_tolerance THEN 'Accelerating'
                    WHEN cd.variance_pct < -:stable_tolerance THEN 'Decelerating'
                    ELSE 'Stable'
                END as trend_category,
                :lookback,
                :horizon,
                i.role_user_id
            FROM combined_data cd
            INNER JOIN inventory i 
                ON i.store_id = cd.store_id AND i.sku = cd.sku
            WHERE i.snapshot_date = (
                SELECT MAX(i2.snapshot_date)
                FROM inventory i2
                WHERE i2.store_id = i.store_id AND i2.sku = i.sku
            )
            ON CONFLICT (store_id, sku) 
            DO UPDATE SET
                recent_actual_demand = EXCLUDED.recent_actual_demand,
                forecasted_demand = EXCLUDED.forecasted_demand,
                demand_variance_pct = EXCLUDED.demand_variance_pct,
                trend_category = EXCLUDED.trend_category,
                lookback_days = EXCLUDED.lookback_days,
                forecast_horizon_days = EXCLUDED.forecast_horizon_days,
                last_updated = NOW();
            """
            
            params = {
                'lookback': lookback_days,
                'horizon': forecast_horizon_days,
                'stable_tolerance': DemandTrendService.STABLE_TOLERANCE_PCT
            }
            
            result = db.session.execute(db.text(query), params)
            db.session.commit()
            rows_affected = result.rowcount
            
            logger.info(f"Demand trends refreshed: {rows_affected} records updated")
            return {"success": True, "rows_affected": rows_affected}
            
        except Exception as e:
            logger.error(f"Error refreshing demand trends: {str(e)}")
            db.session.rollback()
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_store_summary(role_user_id, filters=None):
        """Get store-wise summary of demand trends"""
        from app import db
        
        try:
            where_conditions = ["dt.role_user_id = :role_user_id"]
            params = {"role_user_id": role_user_id}
            
            if filters:
                if filters.get('store_id'):
                    where_conditions.append("dt.store_id = :store_id")
                    params["store_id"] = filters['store_id']
                
                if filters.get('trend_category'):
                    where_conditions.append("dt.trend_category = :trend_category")
                    params["trend_category"] = filters['trend_category']
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                sd.store_id,
                sd.name as store_name,
                sd.city,
                sd.state,
                COUNT(DISTINCT dt.sku) as total_skus,
                COUNT(DISTINCT CASE WHEN dt.trend_category = 'Accelerating' THEN dt.sku END) as accelerating_count,
                COUNT(DISTINCT CASE WHEN dt.trend_category = 'Stable' THEN dt.sku END) as stable_count,
                COUNT(DISTINCT CASE WHEN dt.trend_category = 'Decelerating' THEN dt.sku END) as decelerating_count,
                AVG(dt.demand_variance_pct) as avg_variance_pct,
                MAX(dt.last_updated) as last_updated
            FROM demand_trend dt
            JOIN store_data sd ON sd.store_id = dt.store_id
            WHERE {where_clause}
            GROUP BY sd.store_id, sd.name, sd.city, sd.state
            ORDER BY accelerating_count DESC, decelerating_count DESC;
            """
            
            result = db.session.execute(db.text(query), params)
            columns = result.keys()
            results = [dict(zip(columns, row)) for row in result.fetchall()]
            
            return {"success": True, "data": results}
            
        except Exception as e:
            logger.error(f"Error getting store summary: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_sku_details(store_id, role_user_id, filters=None):
        """Get SKU-wise demand trend details for a specific store"""
        from app import db
        
        try:
            where_conditions = [
                "dt.store_id = :store_id",
                "dt.role_user_id = :role_user_id"
            ]
            params = {"store_id": store_id, "role_user_id": role_user_id}
            
            if filters:
                if filters.get('trend_category'):
                    where_conditions.append("dt.trend_category = :trend_category")
                    params["trend_category"] = filters['trend_category']
                
                if filters.get('sku'):
                    where_conditions.append("dt.sku ILIKE :sku")
                    params["sku"] = f"%{filters['sku']}%"
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                dt.sku,
                i.product_name,
                dt.recent_actual_demand,
                dt.forecasted_demand,
                dt.demand_variance_pct,
                dt.trend_category,
                dt.lookback_days,
                dt.forecast_horizon_days,
                dt.last_updated,
                CASE 
                    WHEN dt.trend_category = 'Accelerating' THEN 1
                    WHEN dt.trend_category = 'Stable' THEN 2
                    WHEN dt.trend_category = 'Decelerating' THEN 3
                    ELSE 4
                END as priority_order
            FROM demand_trend dt
            LEFT JOIN inventory i 
                ON i.store_id = dt.store_id 
                AND i.sku = dt.sku
                AND i.snapshot_date = (
                    SELECT MAX(i2.snapshot_date)
                    FROM inventory i2
                    WHERE i2.store_id = i.store_id AND i2.sku = i.sku
                )
            WHERE {where_clause}
            ORDER BY priority_order, ABS(dt.demand_variance_pct) DESC;
            """
            
            result = db.session.execute(db.text(query), params)
            columns = result.keys()
            results = [dict(zip(columns, row)) for row in result.fetchall()]
            
            return {"success": True, "data": results}
            
        except Exception as e:
            logger.error(f"Error getting SKU details: {str(e)}")
            return {"success": False, "error": str(e)}