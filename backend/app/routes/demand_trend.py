from flask import Blueprint, request, jsonify
from app import db  # Import the SQLAlchemy instance
from sqlalchemy import text
import logging
from contextlib import closing

logger = logging.getLogger(__name__)

# Create blueprint
demand_trend_bp = Blueprint('demand_trend', __name__)

@demand_trend_bp.route('/demand-trend/store-summary', methods=['GET'])
def get_store_summary():
    """
    Get aggregated demand trend summary by store
    Returns: store_id, counts by category
    """
    try:
        logger.info("=== Demand Trend Store Summary Endpoint Hit ===")
        logger.info(f"Request headers: {dict(request.headers)}")
        logger.info("Fetching demand trend store summary")
        
        query = text("""
        SELECT 
            store_id,
            COUNT(*) as total_skus,
            SUM(CASE WHEN trend_category = 'Accelerating' THEN 1 ELSE 0 END) as accelerating_count,
            SUM(CASE WHEN trend_category = 'Stable' THEN 1 ELSE 0 END) as stable_count,
            SUM(CASE WHEN trend_category = 'Decelerating' THEN 1 ELSE 0 END) as decelerating_count,
            AVG(demand_variance_pct) as avg_variance_pct,
            MAX(last_updated) as last_updated
        FROM public.demand_trend
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
                    elif hasattr(value, 'isoformat'):  # Datetime
                        row_dict[key] = value.isoformat()
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} stores in demand trend summary")
        
        return jsonify({
            'success': True,
            'count': len(data),
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Error in get_store_summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@demand_trend_bp.route('/demand-trend/sku-details/<int:store_id>', methods=['GET'])
def get_sku_details(store_id):
    """
    Get detailed SKU-level demand trend data for a specific store
    Query Parameters:
    - trend_category: 'Accelerating', 'Stable', 'Decelerating' (optional filter)
    
    Returns: All SKU details for the store
    """
    try:
        # Get optional category filter
        trend_category = request.args.get('trend_category')
        
        logger.info(f"Fetching SKU details for store_id: {store_id}, trend_category: {trend_category}")
        
        # Base query
        query_str = """
        SELECT 
            id,
            store_id,
            sku,
            recent_actual_demand as recent_avg_sales,
            forecasted_demand as forecast_demand,
            demand_variance_pct as trend_percentage,
            trend_category,
            lookback_days,
            forecast_horizon_days,
            last_updated
        FROM public.demand_trend
        WHERE store_id = :store_id
        """
        
        params = {'store_id': store_id}
        
        # Add category filter if provided
        if trend_category and trend_category in ['Accelerating', 'Stable', 'Decelerating']:
            query_str += " AND trend_category = :trend_category"
            params['trend_category'] = trend_category
        
        query_str += " ORDER BY ABS(demand_variance_pct) DESC, sku"
        
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
                    elif hasattr(value, 'isoformat'):  # Datetime
                        row_dict[key] = value.isoformat()
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} SKUs for store_id: {store_id}")
        
        return jsonify({
            'success': True,
            'store_id': store_id,
            'trend_category_filter': trend_category,
            'count': len(data),
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Error in get_sku_details: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@demand_trend_bp.route('/demand-trend/by-category', methods=['GET'])
def get_by_category():
    """
    Get all demand trend records filtered by category
    Query Parameters:
    - trend_category: 'Accelerating', 'Stable', 'Decelerating' (required)
    
    Returns: All records matching the category
    """
    try:
        trend_category = request.args.get('trend_category')
        
        # Validate category parameter
        if not trend_category:
            return jsonify({'error': 'trend_category parameter is required'}), 400
            
        if trend_category not in ['Accelerating', 'Stable', 'Decelerating']:
            return jsonify({'error': 'trend_category must be Accelerating, Stable, or Decelerating'}), 400
        
        logger.info(f"Fetching demand trend records with category: {trend_category}")
        
        query = text("""
        SELECT 
            id,
            store_id,
            sku,
            recent_actual_demand,
            forecasted_demand,
            demand_variance_pct,
            trend_category,
            lookback_days,
            forecast_horizon_days,
            last_updated
        FROM public.demand_trend
        WHERE trend_category = :trend_category
        ORDER BY ABS(demand_variance_pct) DESC, store_id, sku
        """)
        
        params = {'trend_category': trend_category}
        
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
        
        logger.info(f"Found {len(data)} records with category: {trend_category}")
        
        return jsonify({
            'success': True,
            'trend_category': trend_category,
            'count': len(data),
            'data': data
        })
        
    except Exception as e:
        logger.error(f"Error in get_by_category: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@demand_trend_bp.route('/demand-trend/refresh', methods=['POST'])
def refresh_demand_trend():
    """
    Manually trigger refresh of demand trend calculations
    Updates the last_updated timestamp
    """
    try:
        logger.info("Refreshing demand trend data")
        
        # Get optional parameters from request
        data = request.json or {}
        lookback_days = data.get('lookback_days', 30)
        forecast_horizon_days = data.get('forecast_horizon_days', 14)
        
        # Simple refresh - just update timestamps
        # You can add your calculation logic here if needed
        query = text("""
        UPDATE public.demand_trend
        SET last_updated = CURRENT_TIMESTAMP
        WHERE id IS NOT NULL
        """)
        
        result = db.session.execute(query)
        db.session.commit()
        
        rows_affected = result.rowcount
        
        logger.info(f"Refreshed {rows_affected} demand trend records")
        
        return jsonify({
            'success': True,
            'message': 'Demand trend data refreshed successfully',
            'rows_affected': rows_affected,
            'lookback_days': lookback_days,
            'forecast_horizon_days': forecast_horizon_days
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in refresh_demand_trend: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'details': str(e)
        }), 500


@demand_trend_bp.route('/demand-trend/categories', methods=['GET'])
def get_categories():
    """Get list of available trend categories"""
    categories = [
        {
            "value": "Accelerating",
            "label": "Accelerating (Stock Up)",
            "color": "green",
            "description": "Forecasted demand > recent sales"
        },
        {
            "value": "Stable",
            "label": "Stable (Normal)",
            "color": "blue",
            "description": "Forecast matches recent sales"
        },
        {
            "value": "Decelerating",
            "label": "Decelerating (Slow Down)",
            "color": "orange",
            "description": "Forecasted demand < recent sales"
        }
    ]
    return jsonify({
        "success": True,
        "data": categories
    }), 200


# Test route
@demand_trend_bp.route('/demand-trend/test', methods=['GET'])
def test_route():
    return jsonify({
        "message": "Demand Trend API is working!",
        "status": "ok",
        "endpoints": {
            "store_summary": "/api/demand-trend/store-summary",
            "sku_details": "/api/demand-trend/sku-details/<store_id>?trend_category=Accelerating",
            "by_category": "/api/demand-trend/by-category?trend_category=Stable",
            "categories": "/api/demand-trend/categories",
            "refresh": "/api/demand-trend/refresh (POST)"
        }
    })