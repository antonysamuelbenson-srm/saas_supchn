"""
This module contains categorized questions for the chatbot knowledge base.
These questions are organized by user intent to help the chatbot understand
and respond to different types of queries.
"""

QUESTION_CATEGORIES = {
    "dashboard_general": {
        "name": "Dashboard & General Inquiries",
        "description": "High-level summary questions a user might ask to get a quick overview.",
        "questions": [
            "Summarize the inventory status."
        ]
    },
    "inventory_management": {
        "name": "Inventory Management",
        "description": "Questions focusing on the current state of physical stock.",
        "questions": [
            "What is the total stock on hand?",
            "Show me products with low inventory."
        ]
    },
    "demand_forecasting": {
        "name": "Demand Forecasting",
        "description": "Questions related to predicting future demand.",
        "subcategories": {
            "forecast_results": {
                "name": "Forecast Results",
                "description": "Questions about forecast outputs and trends.",
                "questions": [
                    "What is the forecasted demand for next month?",
                    "Show me the trend for store 'S001'.",
                    "Which SKU has the highest demand?",
                    "Compare actuals vs. forecast for last week."
                ]
            },
            "forecast_accuracy": {
                "name": "Forecast Accuracy & Performance",
                "description": "Questions about how accurate the forecasts are.",
                "questions": [
                    "What's the overall forecast accuracy?",
                    "What is the overall WMAPE?",
                    "Which SKU has the lowest accuracy?",
                    "Which store is the least accurate?",
                    "Show me the top 5 most accurate stores.",
                    "Find the performance for SKU 'ABC-123'.",
                    "Compare accuracy for the last two weeks.",
                    "What does WMAPE mean?",
                    "Explain what forecast bias means."
                ]
            }
        }
    },
    "inventory_optimization": {
        "name": "Inventory Optimization",
        "description": "Questions related to actions taken based on inventory and forecast data, such as rebalancing stock.",
        "questions": [
            "Why should I rebalance inventory?",
            "Which location has the most excess stock?",
            "How are transfer costs calculated?",
            "What does DDOS mean?",
            "Can I download a detailed report?"
        ]
    },
    "administration": {
        "name": "Administration & Settings",
        "description": "Questions about configuring the system, managing entities, and viewing system information.",
        "subcategories": {
            "user_management": {
                "name": "User Management",
                "description": "Questions about managing users in the system.",
                "questions": [
                    "How many admins are there?",
                    "List all deactivated users.",
                    "Find user 'jane.doe@example.com'.",
                    "How do I change a user's role?",
                    "What's the difference between deactivating and deleting?"
                ]
            },
            "store_management": {
                "name": "Store Management",
                "description": "Questions about managing stores in the system.",
                "questions": [
                    "What fields are required for a new store?",
                    "How do I update a store's address?",
                    "Can I add multiple stores at once?",
                    "How do I find latitude and longitude?",
                    "Can I change a store's code after it's created?",
                    "What is 'Capacity (Units)' used for?",
                    "What happens when I update store details?"
                ]
            },
            "system_configuration": {
                "name": "System Configuration",
                "description": "Questions about configuring the system.",
                "questions": [
                    "What do the different formulas do?",
                    "How do I apply a formula to all stores?",
                    "Explain what 'recompute' means.",
                    "Can I apply more than one formula?",
                    "What is a 'forecast lookahead'?",
                    "What is the recommended lookahead period?",
                    "Does changing this affect past forecasts?",
                    "How do I set up a weekly schedule?",
                    "What's a manual vs. scheduled run?",
                    "Can I view the current schedule?",
                    "How long does a manual run take?"
                ]
            },
            "data_management": {
                "name": "Data Management",
                "description": "Questions about managing data in the system.",
                "questions": [
                    "What file formats are supported?",
                    "Is there a maximum file size?",
                    "How do I upload multiple files?",
                    "What happens to my data after upload?"
                ]
            },
            "system_logs": {
                "name": "System Logs",
                "description": "Questions about system logs.",
                "questions": [
                    "When was the last forecast run?",
                    "Have there been any failed runs?",
                    "Show me the details of the latest run."
                ]
            }
        }
    }
}

# Flatten the questions for easier access
def flatten_questions():
    """
    Flatten the nested question categories into a simple list of questions with metadata.
    """
    flattened = []
    
    for category_id, category in QUESTION_CATEGORIES.items():
        # Handle direct questions in the category
        if "questions" in category:
            for question in category["questions"]:
                flattened.append({
                    "question": question,
                    "category": category["name"],
                    "category_id": category_id,
                    "subcategory": None,
                    "subcategory_id": None
                })
        
        # Handle subcategories
        if "subcategories" in category:
            for subcategory_id, subcategory in category["subcategories"].items():
                for question in subcategory["questions"]:
                    flattened.append({
                        "question": question,
                        "category": category["name"],
                        "category_id": category_id,
                        "subcategory": subcategory["name"],
                        "subcategory_id": subcategory_id
                    })
    
    return flattened

FLATTENED_QUESTIONS = flatten_questions()

# Create explanations for common terms and concepts
TERM_EXPLANATIONS = {
    "WMAPE": "Weighted Mean Absolute Percentage Error (WMAPE) is a measure of forecast accuracy that weights errors by the actual values to give more importance to high-volume items. Lower values indicate better accuracy.",
    "MAE": "Mean Absolute Error (MAE) is the average of the absolute differences between forecasted values and actual values. It measures the average magnitude of errors without considering their direction.",
    "Forecast Bias": "Forecast bias indicates whether forecasts consistently overestimate (positive bias) or underestimate (negative bias) actual demand. A value close to zero indicates balanced forecasting.",
    "DDOS": "Days of On-hand Stock (DDOS) represents how many days the current inventory will last based on forecasted demand. It helps identify overstocked or understocked items.",
    "Rebalancing": "Inventory rebalancing is the process of redistributing stock between locations to optimize inventory levels, reduce stockouts, and minimize excess inventory costs.",
    "Transfer Cost": "Transfer cost is the expense associated with moving inventory between locations. It includes transportation, handling, and administrative costs.",
    "Safety Stock": "Safety stock is additional inventory maintained to mitigate the risk of stockouts due to demand variability or supply chain disruptions.",
    "Forecast Lookahead": "Forecast lookahead is the time period into the future for which demand is predicted. Longer lookaheads typically have lower accuracy but provide more planning time."
}