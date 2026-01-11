METRICS_FORMULAS = {
    "SKU Availability Rate": {
        "description": "The percentage of eligible SKUs that were NOT out of stock for a given week. Calculated using inventory and forecast data.",
        "sql_template": "This metric is complex, pre-calculated, and stored in the 'availability_rate' table (if available), or can be derived from joining 'inventory' (qty) and 'forecast_daily' (forecast_qty) tables based on the week_start.",
        "tables": ["inventory", "forecast_daily", "availability_rate"]
    },
    "Fill Rate Probability": {
        "description": "The probability that today's inventory can fulfill expected demand for the next 7 days. This is a pre-calculated, high-level KPI.",
        "sql_template": "Retrieve the 'fill_rate_probability' column from the 'dashboard_metrics' table, ordered by 'timestamp' DESC LIMIT 1.",
        "tables": ["dashboard_metrics"]
    },
    "Current Inventory Position": {
        "description": "The accumulated total number of SKUs across all stores.",
        "sql_template": "Retrieve the 'inventory_position' column from the 'dashboard_metrics' table, ordered by 'timestamp' DESC LIMIT 1.",
        "tables": ["dashboard_metrics"]
    },
    "Weeks of Supply (WOS) Metric": {
        "description": "The accumulated total number of weeks of demand that can be covered by current inventory across the network.",
        "sql_template": "Retrieve the 'weeks_of_supply' column from the 'dashboard_metrics' table, ordered by 'timestamp' DESC LIMIT 1.",
        "tables": ["dashboard_metrics"]
    },
    "Projected Stockouts": {
        "description": "The total number of unique stockouts projected to happen across the network.",
        "sql_template": "Retrieve the 'projected_stockouts' column from the 'dashboard_metrics' table, ordered by 'timestamp' DESC LIMIT 1.",
        "tables": ["dashboard_metrics"]
    },
}
