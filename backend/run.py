# run.py
import os
from dotenv import load_dotenv
load_dotenv()  # ✅ Load .env variables first
# from app.forecast_scheduler import start_forecast_scheduler
# --- ADD THIS DEBUG BLOCK ---
print("--- DEBUGGING .env IN run.py ---")
print(f"GROQ_API_KEY from os.getenv: '{os.getenv('GROQ_API_KEY')}'")
print("--- END DEBUG ---")
# --- END DEBUG BLOCK ---
# from app.services.forecast_service import execute_forecast_job
from app import create_app  # 🧠 This will now use the loaded env vars

app = create_app()

# 🔍 Print all registered routes
print("📌 Registered Flask routes:")
for rule in app.url_map.iter_rules():
    print(f"{rule.methods} -> {rule.rule}")

if __name__ == "__main__":
    # def execute_forecast_job_with_context(schedule_id=None):
    #     with app.app_context():
    #         execute_forecast_job(schedule_id)
    app.run(debug=True, port=5500)
