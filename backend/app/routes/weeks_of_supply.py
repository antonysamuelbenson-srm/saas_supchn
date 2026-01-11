from flask import Blueprint, request, jsonify
from app import db  # Import the SQLAlchemy instance
from sqlalchemy import text
import logging
from contextlib import closing

logger = logging.getLogger(__name__)

# Create blueprint
weeks_of_supply_bp = Blueprint('weeks_of_supply', __name__)

@weeks_of_supply_bp.route('/weeks-of-supply/store-summary', methods=['GET'])
def get_store_summary():
    """
    Get aggregated weeks of supply summary by store (based on forecasted demand)
    Returns: store_id, counts by category, avg weeks of supply
    """
    try:
        logger.info("Fetching weeks of supply store summary")
        
        query = text("""
        SELECT 
            store_id,
            COUNT(*) as total_skus,
            SUM(CASE WHEN category = 'Critical' THEN 1 ELSE 0 END) as critical_count,
            SUM(CASE WHEN category = 'Low' THEN 1 ELSE 0 END) as low_count,
            SUM(CASE WHEN category = 'Adequate' THEN 1 ELSE 0 END) as adequate_count,
            SUM(CASE WHEN category = 'High' THEN 1 ELSE 0 END) as high_count,
            AVG(weeks_of_supply) as avg_weeks_of_supply
        FROM public.weeks_of_supply
        GROUP BY store_id
        ORDER BY store_id
        """)
        
        with closing(db.session.execute(query)) as result:
            columns = result.keys()
            rows = result.fetchall()
            
            data = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                # Convert decimal/numeric values to float
                for key, value in row_dict.items():
                    if hasattr(value, 'quantize'):  # Decimal type
                        row_dict[key] = float(value)
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} stores in weeks of supply summary")
        
        return jsonify({
            'success': True,
            'count': len(data),
            'data': data,
            'data_source': 'forecast (predict table)'
        })
        
    except Exception as e:
        logger.error(f"Error in get_store_summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@weeks_of_supply_bp.route('/weeks-of-supply/sku-details/<int:store_id>', methods=['GET'])
def get_sku_details(store_id):
    """
    Get detailed SKU-level weeks of supply data for a specific store (based on forecasted demand)
    Query Parameters:
    - category: 'Critical', 'Low', 'Adequate', 'High' (optional filter)
    
    Returns: All SKU details for the store
    """
    try:
        # Get optional category filter
        category = request.args.get('category')
        
        logger.info(f"Fetching SKU details for store_id: {store_id}, category: {category}")
        
        # Base query
        query_str = """
        SELECT 
            id,
            store_id,
            sku,
            current_inventory,
            avg_weekly_demand,
            weeks_of_supply,
            category,
            last_updated
        FROM public.weeks_of_supply
        WHERE store_id = :store_id
        """
        
        params = {'store_id': store_id}
        
        # Add category filter if provided
        if category and category in ['Critical', 'Low', 'Adequate', 'High']:
            query_str += " AND category = :category"
            params['category'] = category
        
        query_str += " ORDER BY weeks_of_supply ASC, sku"
        
        query = text(query_str)
        
        with closing(db.session.execute(query, params)) as result:
            columns = result.keys()
            rows = result.fetchall()
            
            data = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                # Convert decimal/numeric values to float
                for key, value in row_dict.items():
                    if hasattr(value, 'quantize'):  # Decimal type
                        row_dict[key] = float(value)
                    # Convert datetime to ISO format string
                    elif hasattr(value, 'isoformat'):
                        row_dict[key] = value.isoformat()
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} SKUs for store_id: {store_id}")
        
        return jsonify({
            'success': True,
            'store_id': store_id,
            'category_filter': category,
            'count': len(data),
            'data': data,
            'data_source': 'forecast (predict table)'
        })
        
    except Exception as e:
        logger.error(f"Error in get_sku_details: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@weeks_of_supply_bp.route('/weeks-of-supply/by-category', methods=['GET'])
def get_by_category():
    """
    Get all weeks of supply records filtered by category (based on forecasted demand)
    Query Parameters:
    - category: 'Critical', 'Low', 'Adequate', 'High' (required)
    
    Returns: All records matching the category
    """
    try:
        category = request.args.get('category')
        
        # Validate category parameter
        if not category:
            return jsonify({'error': 'category parameter is required'}), 400
            
        if category not in ['Critical', 'Low', 'Adequate', 'High']:
            return jsonify({'error': 'category must be Critical, Low, Adequate, or High'}), 400
        
        logger.info(f"Fetching weeks of supply records with category: {category}")
        
        query = text("""
        SELECT 
            id,
            store_id,
            sku,
            current_inventory,
            avg_weekly_demand,
            weeks_of_supply,
            category,
            last_updated
        FROM public.weeks_of_supply
        WHERE category = :category
        ORDER BY weeks_of_supply ASC, store_id, sku
        """)
        
        params = {'category': category}
        
        with closing(db.session.execute(query, params)) as result:
            columns = result.keys()
            rows = result.fetchall()
            
            data = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                # Convert decimal/numeric values to float
                for key, value in row_dict.items():
                    if hasattr(value, 'quantize'):  # Decimal type
                        row_dict[key] = float(value)
                    elif hasattr(value, 'isoformat'):
                        row_dict[key] = value.isoformat()
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} records with category: {category}")
        
        return jsonify({
            'success': True,
            'category': category,
            'count': len(data),
            'data': data,
            'data_source': 'forecast (predict table)'
        })
        
    except Exception as e:
        logger.error(f"Error in get_by_category: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@weeks_of_supply_bp.route('/weeks-of-supply/recalculate-categories', methods=['POST'])
def recalculate_categories():
    """
    Recalculate categories based on custom week thresholds
    Request Body (JSON):
    {
        "critical_threshold": 2,    # weeks < this = Critical
        "low_threshold": 4,          # weeks < this = Low
        "adequate_threshold": 8      # weeks < this = Adequate, >= this = High
    }
    
    Default thresholds if not provided: Critical < 2, Low < 4, Adequate < 8, High >= 8
    """
    try:
        data = request.get_json()
        
        # Get thresholds from request or use defaults
        critical_threshold = data.get('critical_threshold', 2)
        low_threshold = data.get('low_threshold', 4)
        adequate_threshold = data.get('adequate_threshold', 8)
        
        # Validate thresholds
        if not all(isinstance(t, (int, float)) and t > 0 for t in [critical_threshold, low_threshold, adequate_threshold]):
            return jsonify({
                'success': False,
                'error': 'All thresholds must be positive numbers'
            }), 400
        
        if not (critical_threshold < low_threshold < adequate_threshold):
            return jsonify({
                'success': False,
                'error': 'Thresholds must be in ascending order: critical < low < adequate'
            }), 400
        
        logger.info(f"Recalculating categories with thresholds: Critical<{critical_threshold}, Low<{low_threshold}, Adequate<{adequate_threshold}")
        
        # Update categories based on new thresholds
        query = text("""
        UPDATE public.weeks_of_supply
        SET 
            category = CASE 
                WHEN weeks_of_supply < :critical_threshold THEN 'Critical'
                WHEN weeks_of_supply < :low_threshold THEN 'Low'
                WHEN weeks_of_supply < :adequate_threshold THEN 'Adequate'
                ELSE 'High'
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE id IS NOT NULL
        """)
        
        result = db.session.execute(query, {
            'critical_threshold': critical_threshold,
            'low_threshold': low_threshold,
            'adequate_threshold': adequate_threshold
        })
        db.session.commit()
        
        rows_affected = result.rowcount
        
        logger.info(f"Recalculated categories for {rows_affected} records")
        
        return jsonify({
            'success': True,
            'message': 'Categories recalculated successfully',
            'rows_affected': rows_affected,
            'thresholds': {
                'critical': f'< {critical_threshold} weeks',
                'low': f'{critical_threshold} - {low_threshold} weeks',
                'adequate': f'{low_threshold} - {adequate_threshold} weeks',
                'high': f'>= {adequate_threshold} weeks'
            },
            'data_source': 'forecast (predict table)'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in recalculate_categories: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@weeks_of_supply_bp.route('/weeks-of-supply/refresh', methods=['POST'])
def refresh_weeks_of_supply():
    """
    Recalculate weeks of supply using FORECASTED demand from predict table
    Request Body (JSON - optional):
    {
        "forecast_days": 30  # Number of days ahead to look for forecast data (default: 30)
    }
    """
    try:
        data = request.get_json() or {}
        forecast_days = data.get('forecast_days', 30)
        
        # Validate forecast_days
        if not isinstance(forecast_days, int) or forecast_days < 1 or forecast_days > 365:
            return jsonify({
                'success': False,
                'error': 'forecast_days must be an integer between 1 and 365'
            }), 400
        
        logger.info(f"Refreshing weeks of supply data using forecast (next {forecast_days} days)")
        
        # Delete existing records and recalculate from scratch
        query = text(f"""
        WITH 
        -- Calculate average weekly FORECASTED demand from predict table
        forecast_summary AS (
            SELECT 
                sd.store_id as store_id,
                p.product_id as sku,
                COALESCE(AVG(p.predicted) * 7, 0) as avg_weekly_demand
            FROM public.predict p
            INNER JOIN public.store_data sd 
                ON (p.store_id = sd.store_code OR p.store_id::TEXT = sd.store_id::TEXT)
            WHERE p.date >= CURRENT_DATE 
                AND p.date < CURRENT_DATE + INTERVAL '{forecast_days} days'
                AND p.predicted IS NOT NULL
                AND p.predicted > 0
            GROUP BY sd.store_id, p.product_id
        ),
        -- Get current inventory levels
        current_inventory AS (
            SELECT 
                i.store_id,
                i.sku,
                i.qty as current_qty,
                i.role_user_id
            FROM public.inventory i
            WHERE i.qty >= 0
                AND i.snapshot_date = (
                    SELECT MAX(i2.snapshot_date)
                    FROM public.inventory i2
                    WHERE i2.store_id = i.store_id 
                        AND i2.sku = i.sku
                )
        ),
        -- Combine inventory with forecast data
        combined_data AS (
            SELECT 
                ci.store_id,
                ci.sku,
                ci.current_qty,
                COALESCE(fs.avg_weekly_demand, 0) as avg_weekly_demand,
                ci.role_user_id,
                CASE 
                    WHEN COALESCE(fs.avg_weekly_demand, 0) = 0 THEN 999.99
                    WHEN fs.avg_weekly_demand IS NULL THEN 999.99
                    ELSE ROUND((ci.current_qty / NULLIF(fs.avg_weekly_demand, 0))::NUMERIC, 2)
                END as weeks_of_supply_calc
            FROM current_inventory ci
            LEFT JOIN forecast_summary fs 
                ON fs.store_id = ci.store_id 
                AND fs.sku = ci.sku
        )
        INSERT INTO public.weeks_of_supply 
            (store_id, sku, current_inventory, avg_weekly_demand, weeks_of_supply, category, role_user_id, last_updated)
        SELECT 
            cd.store_id,
            cd.sku,
            cd.current_qty,
            cd.avg_weekly_demand,
            cd.weeks_of_supply_calc,
            CASE 
                WHEN cd.avg_weekly_demand = 0 THEN 'High'
                WHEN cd.weeks_of_supply_calc < 2 THEN 'Critical'
                WHEN cd.weeks_of_supply_calc >= 2 AND cd.weeks_of_supply_calc < 4 THEN 'Low'
                WHEN cd.weeks_of_supply_calc >= 4 AND cd.weeks_of_supply_calc <= 8 THEN 'Adequate'
                ELSE 'High'
            END,
            cd.role_user_id,
            NOW()
        FROM combined_data cd
        ON CONFLICT (store_id, sku) 
        DO UPDATE SET
            current_inventory = EXCLUDED.current_inventory,
            avg_weekly_demand = EXCLUDED.avg_weekly_demand,
            weeks_of_supply = EXCLUDED.weeks_of_supply,
            category = EXCLUDED.category,
            last_updated = NOW()
        """)
        
        result = db.session.execute(query)
        db.session.commit()
        
        rows_affected = result.rowcount
        
        logger.info(f"Refreshed {rows_affected} weeks of supply records using forecast data")
        
        return jsonify({
            'success': True,
            'message': 'Weeks of supply data refreshed successfully using forecasted demand',
            'rows_affected': rows_affected,
            'data_source': 'forecast (predict table)',
            'forecast_horizon_days': forecast_days
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in refresh_weeks_of_supply: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


# Test route
@weeks_of_supply_bp.route('/weeks-of-supply/test', methods=['GET'])
def test_route():
    return jsonify({
        "message": "Weeks of Supply API is working!",
        "status": "ok",
        "data_source": "forecast (predict table)",
        "description": "Calculations based on forecasted demand from predict table",
        "endpoints": {
            "store_summary": "/api/weeks-of-supply/store-summary",
            "sku_details": "/api/weeks-of-supply/sku-details/<store_id>?category=Critical",
            "by_category": "/api/weeks-of-supply/by-category?category=Low",
            "recalculate_categories": "/api/weeks-of-supply/recalculate-categories (POST)",
            "refresh": "/api/weeks-of-supply/refresh (POST with optional forecast_days)"
        }
    })