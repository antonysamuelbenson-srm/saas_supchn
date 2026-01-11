import psycopg2
import pandas as pd
from typing import List, Dict, Optional
import json
from datetime import datetime

class InventoryLevelsFetcher:
    def __init__(self, db_config: Dict[str, str]):
        """
        Initialize database connection
        
        Args:
            db_config: Dictionary containing database connection parameters
                      {'host': 'localhost', 'database': 'your_db', 'user': 'username', 'password': 'password', 'port': '5432'}
        """
        self.db_config = db_config
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            print("✅ Database connection established successfully!")
        except psycopg2.Error as e:
            print(f"❌ Error connecting to database: {e}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("📤 Database connection closed.")
    
    def get_inventory_levels(self, level_filter: str = None, store_ids: List[int] = None) -> pd.DataFrame:
        """
        Fetch store inventory levels based on filter criteria
        
        Args:
            level_filter: 'Low', 'Medium', 'High', or None for all levels
            store_ids: List of specific store IDs to filter, or None for all stores
            
        Returns:
            pandas.DataFrame with store inventory data
        """
        if not self.connection:
            self.connect()
        
        # Base query using the view we created
        base_query = """
        SELECT 
            store_id,
            store_name,
            store_location,
            current_inventory,
            max_capacity,
            target_level,
            safety_stock,
            inventory_percentage,
            level_category,
            warehouse_name,
            available_capacity,
            excess_over_safety,
            units_to_target,
            operational_status,
            last_updated
        FROM public.store_inventory_summary
        """
        
        # Build WHERE conditions
        conditions = []
        params = []
        
        if level_filter:
            conditions.append("level_category = %s")
            params.append(level_filter)
        
        if store_ids:
            placeholders = ','.join(['%s'] * len(store_ids))
            conditions.append(f"store_id IN ({placeholders})")
            params.extend(store_ids)
        
        # Add WHERE clause if conditions exist
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
        
        base_query += " ORDER BY inventory_percentage ASC, store_name"
        
        try:
            df = pd.read_sql_query(base_query, self.connection, params=params)
            print(f"✅ Fetched {len(df)} records successfully!")
            return df
        except psycopg2.Error as e:
            print(f"❌ Error executing query: {e}")
            raise
    
    def get_level_summary(self) -> pd.DataFrame:
        """Get summary statistics for each inventory level"""
        if not self.connection:
            self.connect()
        
        query = """
        SELECT 
            level_category,
            COUNT(*) as store_count,
            ROUND(AVG(inventory_percentage), 2) as avg_percentage,
            ROUND(MIN(inventory_percentage), 2) as min_percentage,
            ROUND(MAX(inventory_percentage), 2) as max_percentage,
            SUM(current_inventory) as total_inventory,
            SUM(max_capacity) as total_capacity
        FROM public.store_inventory_summary
        GROUP BY level_category
        ORDER BY 
            CASE level_category 
                WHEN 'Low' THEN 1 
                WHEN 'Medium' THEN 2 
                WHEN 'High' THEN 3 
                ELSE 4 
            END
        """
        
        try:
            df = pd.read_sql_query(query, self.connection)
            return df
        except psycopg2.Error as e:
            print(f"❌ Error getting summary: {e}")
            raise
    
    def get_store_list(self) -> pd.DataFrame:
        """Get list of all stores for reference"""
        if not self.connection:
            self.connect()
        
        query = """
        SELECT 
            store_id,
            store_name,
            store_location,
            level_category,
            inventory_percentage
        FROM public.store_inventory_summary
        ORDER BY store_name
        """
        
        try:
            df = pd.read_sql_query(query, self.connection)
            return df
        except psycopg2.Error as e:
            print(f"❌ Error getting store list: {e}")
            raise

def display_menu():
    """Display interactive menu for user selection"""
    print("\n" + "="*50)
    print("🏪 STORE INVENTORY LEVELS FILTER")
    print("="*50)
    print("1. 🔴 Low Inventory Stores (< 20%)")
    print("2. 🟡 Medium Inventory Stores (20% - 80%)")
    print("3. 🟢 High Inventory Stores (> 80%)")
    print("4. 📊 All Stores")
    print("5. 📈 Summary Statistics")
    print("6. 🏬 Store List")
    print("7. 🔍 Custom Store Filter")
    print("8. ❌ Exit")
    print("="*50)

def get_user_choice():
    """Get and validate user input"""
    while True:
        try:
            choice = int(input("Enter your choice (1-8): "))
            if 1 <= choice <= 8:
                return choice
            else:
                print("❌ Please enter a number between 1 and 8")
        except ValueError:
            print("❌ Please enter a valid number")

def display_results(df: pd.DataFrame, title: str):
    """Display results in a formatted table"""
    print(f"\n🎯 {title}")
    print("-" * len(title))
    
    if df.empty:
        print("❌ No data found for the selected criteria.")
        return
    
    # Display key columns
    display_columns = [
        'store_id', 'store_name', 'store_location', 
        'current_inventory', 'max_capacity', 'inventory_percentage', 
        'level_category', 'operational_status'
    ]
    
    # Filter columns that exist in the dataframe
    existing_columns = [col for col in display_columns if col in df.columns]
    
    # Format the display
    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_colwidth', 20)
    
    print(df[existing_columns].to_string(index=False))
    print(f"\n📊 Total Records: {len(df)}")

def main():
    """Main function to run the interactive script"""
    
    # Database configuration
    # UPDATE THESE VALUES WITH YOUR DATABASE CREDENTIALS
    db_config = {
        'host': 'localhost',          # Your Supabase/PostgreSQL host
        'database': 'your_database',  # Your database name
        'user': 'your_username',      # Your username
        'password': 'your_password',  # Your password
        'port': '5432'                # Database port
    }
    
    # Initialize the fetcher
    fetcher = InventoryLevelsFetcher(db_config)
    
    try:
        fetcher.connect()
        
        while True:
            display_menu()
            choice = get_user_choice()
            
            if choice == 1:
                # Low inventory stores
                df = fetcher.get_inventory_levels(level_filter='Low')
                display_results(df, "LOW INVENTORY STORES (< 20%)")
                
            elif choice == 2:
                # Medium inventory stores
                df = fetcher.get_inventory_levels(level_filter='Medium')
                display_results(df, "MEDIUM INVENTORY STORES (20% - 80%)")
                
            elif choice == 3:
                # High inventory stores
                df = fetcher.get_inventory_levels(level_filter='High')
                display_results(df, "HIGH INVENTORY STORES (> 80%)")
                
            elif choice == 4:
                # All stores
                df = fetcher.get_inventory_levels()
                display_results(df, "ALL STORES")
                
            elif choice == 5:
                # Summary statistics
                df = fetcher.get_level_summary()
                display_results(df, "INVENTORY LEVEL SUMMARY STATISTICS")
                
            elif choice == 6:
                # Store list
                df = fetcher.get_store_list()
                display_results(df, "ALL STORES LIST")
                
            elif choice == 7:
                # Custom store filter
                print("\n🔍 Custom Store Filter")
                try:
                    store_ids_input = input("Enter store IDs (comma-separated, e.g., 167,168,169): ")
                    store_ids = [int(x.strip()) for x in store_ids_input.split(',') if x.strip()]
                    
                    level_input = input("Enter level filter (Low/Medium/High or press Enter for all): ").strip()
                    level_filter = level_input if level_input in ['Low', 'Medium', 'High'] else None
                    
                    df = fetcher.get_inventory_levels(level_filter=level_filter, store_ids=store_ids)
                    display_results(df, f"CUSTOM FILTER RESULTS")
                    
                except ValueError:
                    print("❌ Invalid store IDs format. Please enter numbers separated by commas.")
                
            elif choice == 8:
                print("👋 Goodbye!")
                break
            
            # Ask if user wants to continue
            continue_choice = input("\nPress Enter to continue or 'q' to quit: ").lower()
            if continue_choice == 'q':
                break
                
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        fetcher.disconnect()

# Additional utility functions for API/JSON export
def export_to_json(df: pd.DataFrame, filename: str):
    """Export DataFrame to JSON file"""
    df.to_json(filename, orient='records', date_format='iso', indent=2)
    print(f"✅ Data exported to {filename}")

def get_api_response(level_filter: str, db_config: Dict) -> Dict:
    """
    Function that can be used in Flask/FastAPI endpoints
    Returns JSON-serializable dictionary
    """
    fetcher = InventoryLevelsFetcher(db_config)
    try:
        fetcher.connect()
        df = fetcher.get_inventory_levels(level_filter=level_filter)
        
        return {
            'success': True,
            'level_filter': level_filter,
            'count': len(df),
            'timestamp': datetime.now().isoformat(),
            'data': df.to_dict('records')
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }
    finally:
        fetcher.disconnect()

if __name__ == "__main__":
    main()