
<img width="261" alt="Screenshot 2025-06-18 at 2 26 46 PM" src="https://github.com/user-attachments/assets/4d572935-01ff-4058-9dce-b8303c2c3825" />

current tree for backend :
```bash
.
├── app
│   ├── forecast_scheduler.py
│   ├── __init__.py
│   ├── models
│   │   ├── alert.py
│   │   ├── availability.py
│   │   ├── dashboard.py
│   │   ├── forecast_log.py
│   │   ├── forecast.py
│   │   ├── forecast_schedule.py
│   │   ├── __init__.py
│   │   ├── inventory.py
│   │   ├── predict.py
│   │   ├── products.py
│   │   ├── reorder_config.py
│   │   ├── reorder.py
│   │   ├── roles.py
│   │   ├── sales.py
│   │   ├── store.py
│   │   ├── store_total_data.py
│   │   ├── transfer_cost_data.py
│   │   ├── upload_batch.py
│   │   ├── user.py
│   │   └── warehouse_max_data.py
│   ├── routes
│   │   ├── admin.py
│   │   ├── admin_seeder.py
│   │   ├── alerts.py
│   │   ├── auth.py
│   │   ├── availability.py
│   │   ├── chatbot.py
│   │   ├── config.py
│   │   ├── dashboard.py
│   │   ├── forecast.ipynb
│   │   ├── forecast.py
│   │   ├── __init__.py
│   │   ├── node_location_update.py
│   │   ├── rebalancer.py
│   │   ├── reorder.py
│   │   ├── role_map.py
│   │   ├── store_upload.py
│   │   └── upload.py
│   ├── services
│   │   ├── ai_service.py
│   │   ├── forecast_model.py
│   │   ├── forecast_service.py
│   │   ├── ingest_csvs.py
│   │   ├── rebalancer_services.py
│   │   └── ts.pkl
│   └── utils
│       ├── db.py
│       ├── decorators.py
│       ├── feature_engineering.py
│       ├── forecast_model.pkl
│       ├── forecast_utils.py
│       ├── jwt_utils.py
│       ├── kpi_calc.py
│       ├── model.pkl
│       ├── store_sync.py
│       ├── sync_products.py
│       └── threshold_calc.py
├── client_terminal.py
├── csvs
│   ├── capacity.csv
│   ├── forecast_july_sep_2025.csv
│   ├── forecast_outputs
│   │   ├── forecast_next_weeks_sku.csv
│   │   ├── forecast_next_weeks_store.csv
│   │   ├── metrics_sku.csv
│   │   └── metrics_store.csv
│   ├── inventory_aug_sep_2025.csv
│   ├── inventory_july_sep_2025.csv
│   ├── inventory_modified_2025.csv
│   ├── inventory_snapshot_2024-09-01_sample.csv
│   ├── inv_jul_sep.csv
│   ├── sale_data.csv
│   ├── sales_data.csv
│   ├── stores_master_sample.csv
│   ├── total_store_data.CSV
│   └── transfercost.csv
├── debug_model.lp
├── Dockerfile
├── init_db.py
├── inventory_db.py
├── logic.md
├── readme.md
├── rebalancing_recommendations_2025-09-18.csv
├── rebalancing_recommendations_2025-09-23.csv
├── rebalancing_recommendations_2025-09-28.csv
├── requirements.txt
├── run.py
├── test.csv
└── test.py

8 directories, 86 files
```

📁 app/ — Main Flask application package
This folder contains all the logic of your backend: models, API routes, and utility functions.


📄 app/__init__.py — App Factory

This function creates and configures your Flask app.

It:

- Connects to your Supabase PostgreSQL database

- Loads environment variables 

- Initializes SQLAlchemy (your ORM)

- Registers different parts of the backend (called Blueprints).


📁 models/ — Database Models
These Python files define what your database tables look like.

📄 user.py
Represents the Users table.

- Fields: email, password, role.

- Used for login, registration, and permission-based access.

📄 node.py
- Represents a Node in your network (e.g., a Store or Warehouse).

- Used in configuration.

📄 alert.py
- Stores alerts like stockouts or overstock.

- Fields: type, severity, message, created_at.

📄 dashboard.py
- Stores KPI data for the control tower (current demand, inventory, weeks of supply).

📄inventory.py
- tracks current inventory status per sku
- fields : 
    - sku
    - stock_on_hand
    - in_transit
    - unit_cost
    - node_id
    - last_updated

📄reorder_config.py
- stores calculated threshold values per sku
- fields : 
    - sku
    - avg_daily_usage
    - lead_time_days (for getting started, took constant as 7)
    - safety_stock (taken as 50% of avg_daily_sales)
    - reorder_point (calculated from threshold)

🧠 These are connected to Supabase PostgreSQL through SQLAlchemy ORM.



📁 routes/ — All API Endpoints
These files contain the code that responds to frontend/API requests.

📄 auth.py
Handles:

- POST /register: register new user

- POST /login: login and return JWT token

📄 dashboard.py
GET /dashboard: sends latest KPI data to the frontend.

📄 alerts.py
GET /alerts: returns a list of current alerts to show on dashboard.

📄 upload.py
POST /upload/validate: checks if uploaded CSV has correct columns and no missing data.

📄 config.py
POST /nodes: used to add new Stores or Warehouses to your network.


📁 utils/ — Helper Functions
📄 jwt_utils.py
Contains two functions:

- encode_jwt(payload) – Creates a JWT token.

- decode_jwt(token) – Decodes/validates a JWT token.

- Used for authenticating users on secure endpoints.

📄 kpi_calc.py
this file contains the calculations for all the kpi's
the currently considered kpi's are : 
- current_demand (for next 30 days)
- inventory_position
- weeks_of_supply
- stockout count
- skus_below_threshold
- inventory_turnover

📄 threshold_calc.py
- Calculates reorder points for each SKU using sales data:
    - reorder_point = (avg_daily_usage × lead_time) + safety_stock

- Updates or inserts values into the ReorderConfig table, including: avg_daily_usage, lead_time_days, safety_stock, and reorder_point



📄 .env — Environment Config File
- DATABASE_URL=postgresql://your_supabase_url
- SECRET_KEY=your_flask_secret

📄 requirements.txt — Python Dependencies

📄 run.py — Entry Point to Start Your App

🐳 Dockerfile — For Deployment

🧠 How It All Works Together
- Here’s the flow when a user opens the dashboard:

- User logs in → frontend calls /login → backend checks password → sends a JWT token.

- Frontend sends token when calling /dashboard, /alerts, etc.

- Flask backend decodes token using jwt_utils.py, checks user's role.

If valid, it:

- Queries Supabase DB (via SQLAlchemy)

- Gets KPI/alerts/nodes

- Returns response in JSON

- Frontend shows data visually (charts/cards).

db_psswd : GiV5P3T6YtVLqsIY

📦 Real Example
Imagine this structure:

go
Copy
Edit
project/
├── app/
│   ├── __init__.py      👈 makes `app` a package
│   └── routes/
│       ├── __init__.py  👈 makes `routes` a sub-package
│       └── dashboard.py
Because both app/ and routes/ have __init__.py, Python lets you do:





==================For AI module===========================================
For now the LLM used is Mistral via Ollama as there we some server side and storage issues for using models via hugginface. 
* In order to run and test through client terminal, open a new terminal and run the following command :

```bash
ollama serve
```
then in another terminal run :
```bash
ollama run mistral
```
- make sure to install the dependencies :
    - 
