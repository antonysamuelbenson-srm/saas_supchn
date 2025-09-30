from datetime import datetime, timedelta
import logging


logger = logging.getLogger(__name__)


class WeeksOfSupplyService:
    
    @staticmethod
    def calculate_and_refresh():
        """Calculate and update weeks of supply for all SKUs"""
        # Import db inside the method to avoid circular import
        from app import db
        
        try:
            # Fixed query to handle VARCHAR store_id in sales table
            query = """
            WITH sales_data AS (
                SELECT 
                    sd.store_id as store_id,
                    s.sku,
                    AVG(s.units_sold) * 7 as avg_weekly_demand
                FROM sales s
                INNER JOIN store_data sd 
                    ON (s.store_id = sd.store_code OR s.store_id::TEXT = sd.store_id::TEXT)
                WHERE s.date >= CURRENT_DATE - INTERVAL '30 days'
                    AND s.units_sold > 0
                GROUP BY sd.store_id, s.sku
            )
            INSERT INTO weeks_of_supply 
                (store_id, sku, current_inventory, avg_weekly_demand, 
                 weeks_of_supply, category, role_user_id)
            SELECT 
                i.store_id,
                i.sku,
                i.qty,
                COALESCE(sd.avg_weekly_demand, 0),
                CASE 
                    WHEN COALESCE(sd.avg_weekly_demand, 0) = 0 THEN 999
                    ELSE i.qty / NULLIF(sd.avg_weekly_demand, 0)
                END as weeks_of_supply,
                CASE 
                    WHEN COALESCE(sd.avg_weekly_demand, 0) = 0 THEN 'High'
                    WHEN i.qty / NULLIF(sd.avg_weekly_demand, 0) < 2 THEN 'Critical'
                    WHEN i.qty / NULLIF(sd.avg_weekly_demand, 0) < 4 THEN 'Low'
                    WHEN i.qty / NULLIF(sd.avg_weekly_demand, 0) <= 8 THEN 'Adequate'
                    ELSE 'High'
                END as category,
                i.role_user_id
            FROM inventory i
            LEFT JOIN sales_data sd 
                ON sd.store_id = i.store_id AND sd.sku = i.sku
            WHERE i.snapshot_date = (
                SELECT MAX(i2.snapshot_date)
                FROM inventory i2
                WHERE i2.store_id = i.store_id AND i2.sku = i.sku
            )
            ON CONFLICT (store_id, sku) 
            DO UPDATE SET
                current_inventory = EXCLUDED.current_inventory,
                avg_weekly_demand = EXCLUDED.avg_weekly_demand,
                weeks_of_supply = EXCLUDED.weeks_of_supply,
                category = EXCLUDED.category,
                last_updated = NOW();
            """
            
            # Use SQLAlchemy's session
            result = db.session.execute(db.text(query))
            db.session.commit()
            rows_affected = result.rowcount
            
            logger.info(f"Weeks of supply refreshed: {rows_affected} records updated")
            return {"success": True, "rows_affected": rows_affected}
            
        except Exception as e:
            logger.error(f"Error refreshing weeks of supply: {str(e)}")
            db.session.rollback()
            return {"success": False, "error": str(e)}
    
    @staticmethod
    def get_store_summary(role_user_id, filters=None):
        """Get store-wise summary of weeks of supply"""
        # Import db inside the method to avoid circular import
        from app import db
        
        try:
            # Build filter conditions
            where_conditions = ["wos.role_user_id = :role_user_id"]
            params = {"role_user_id": role_user_id}
            
            if filters:
                if filters.get('store_id'):
                    where_conditions.append("wos.store_id = :store_id")
                    params["store_id"] = filters['store_id']
                
                if filters.get('category'):
                    where_conditions.append("wos.category = :category")
                    params["category"] = filters['category']
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                sd.store_id,
                sd.name as store_name,
                sd.city,
                sd.state,
                COUNT(DISTINCT wos.sku) as total_skus,
                COUNT(DISTINCT CASE WHEN wos.category = 'Critical' THEN wos.sku END) as critical_count,
                COUNT(DISTINCT CASE WHEN wos.category = 'Low' THEN wos.sku END) as low_count,
                COUNT(DISTINCT CASE WHEN wos.category = 'Adequate' THEN wos.sku END) as adequate_count,
                COUNT(DISTINCT CASE WHEN wos.category = 'High' THEN wos.sku END) as high_count,
                AVG(wos.weeks_of_supply) as avg_weeks_of_supply,
                MAX(wos.last_updated) as last_updated
            FROM weeks_of_supply wos
            JOIN store_data sd ON sd.store_id = wos.store_id
            WHERE {where_clause}
            GROUP BY sd.store_id, sd.name, sd.city, sd.state
            ORDER BY critical_count DESC, low_count DESC;
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
        """Get SKU-wise details for a specific store"""
        # Import db inside the method to avoid circular import
        from app import db
        
        try:
            # Build filter conditions
            where_conditions = [
                "wos.store_id = :store_id",
                "wos.role_user_id = :role_user_id"
            ]
            params = {"store_id": store_id, "role_user_id": role_user_id}
            
            if filters:
                if filters.get('category'):
                    where_conditions.append("wos.category = :category")
                    params["category"] = filters['category']
                
                if filters.get('sku'):
                    where_conditions.append("wos.sku ILIKE :sku")
                    params["sku"] = f"%{filters['sku']}%"
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
            SELECT 
                wos.sku,
                i.product_name,
                wos.current_inventory,
                wos.avg_weekly_demand,
                wos.weeks_of_supply,
                wos.category,
                wos.last_updated,
                CASE 
                    WHEN wos.category = 'Critical' THEN 1
                    WHEN wos.category = 'Low' THEN 2
                    WHEN wos.category = 'Adequate' THEN 3
                    ELSE 4
                END as priority_order
            FROM weeks_of_supply wos
            LEFT JOIN inventory i 
                ON i.store_id = wos.store_id 
                AND i.sku = wos.sku
                AND i.snapshot_date = (
                    SELECT MAX(i2.snapshot_date)
                    FROM inventory i2
                    WHERE i2.store_id = i.store_id AND i2.sku = i.sku
                )
            WHERE {where_clause}
            ORDER BY priority_order, wos.weeks_of_supply;
            """
            
            result = db.session.execute(db.text(query), params)
            columns = result.keys()
            results = [dict(zip(columns, row)) for row in result.fetchall()]
            
            return {"success": True, "data": results}
            
        except Exception as e:
            logger.error(f"Error getting SKU details: {str(e)}")
            return {"success": False, "error": str(e)}