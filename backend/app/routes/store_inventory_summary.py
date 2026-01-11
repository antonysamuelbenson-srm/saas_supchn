from flask import Blueprint, request, jsonify
from app import db  # Import the SQLAlchemy instance
from sqlalchemy import text
import logging
from contextlib import closing

logger = logging.getLogger(__name__)

# Create blueprint
store_inventory_bp = Blueprint('store_inventory', __name__)

@store_inventory_bp.route('/store_inventory_summary', methods=['GET'])
def get_store_inventory_summary():
    """
    Get simple store inventory data based on level_category
    Query Parameters:
    - level_category: 'Low', 'Medium', 'High' (required)
    
    Returns: store_name, city, max_capacity, inventory_percentage
    """
    try:
        # Get level_category parameter
        level_category = request.args.get('level_category')
        
        # Validate level_category is provided and valid
        if not level_category:
            return jsonify({'error': 'level_category parameter is required'}), 400
            
        if level_category not in ['Low', 'Medium', 'High']:
            return jsonify({'error': 'level_category must be Low, Medium, or High'}), 400
        
        logger.info(f"Fetching stores with level_category: {level_category}")
        
        # Query to fetch columns expected by client
        query = text("""
        SELECT 
            store_id,
            store_name,
            city,
            address,
            state,
            country,
            lat,
            long,
            max_capacity,
            inventory_percentage,
            current_inventory,
            target_level,
            safety_stock,
            level_category,
            last_updated,
            COALESCE(
                NULLIF(TRIM(city), ''), 
                NULLIF(TRIM(address), ''), 
                NULLIF(TRIM(state), ''), 
                'Store ' || store_id::text
            ) as store_location,
            'Active' as operational_status
        FROM public.store_inventory_levels
        WHERE level_category = :level_category
        ORDER BY store_id
        """)
        
        params = {'level_category': level_category}
        
        # Execute query
        with closing(db.session.execute(query, params)) as result:
            columns = result.keys()
            rows = result.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                # Convert decimal values to float for JSON serialization
                for key, value in row_dict.items():
                    if hasattr(value, 'quantize'):  # Decimal type
                        row_dict[key] = float(value)
                data.append(row_dict)
        
        logger.info(f"Found {len(data)} stores with level_category: {level_category}")
        
        return jsonify({
            'success': True,
            'level_category': level_category,
            'count': len(data),
            'data': data  # Changed from 'stores' to 'data' to match client expectation
        })
        
    except Exception as e:
        logger.error(f"Error in get_store_inventory_summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error', 
            'details': str(e)
        }), 500

# Test route
@store_inventory_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({
        "message": "Simple store inventory API is working!", 
        "status": "ok",
        "usage": "Use /store_inventory_summary?level_category=Medium"
    })