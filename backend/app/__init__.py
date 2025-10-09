from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_cors import CORS
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Validate required environment variables
    required_vars = ['DATABASE_URL', 'SECRET_KEY', 'ANON_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"Required environment variables are missing: {', '.join(missing_vars)}")
    
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    ANON_KEY = os.getenv("ANON_KEY")

    # Initialize database
    from app.models import user, inventory_levels
    db.init_app(app)

    # Configure CORS
    CORS(app,
        origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True
    )

    # Register Blueprints
    try:
        from app.routes import (
            auth, dashboard, alerts, upload, config, store_upload, 
            node_location_update, reorder, availability, admin, 
            forecast, rebalancer, store_inventory_summary, weeks_of_supply, chatbot
        )
        
        app.register_blueprint(auth.bp)
        app.register_blueprint(admin.bp, url_prefix="/admin")
        app.register_blueprint(dashboard.bp)
        app.register_blueprint(alerts.bp)
        app.register_blueprint(upload.bp)
        app.register_blueprint(config.bp)
        app.register_blueprint(store_upload.bp)
        app.register_blueprint(node_location_update.bp)
        app.register_blueprint(reorder.bp)
        app.register_blueprint(availability.bp)
        app.register_blueprint(forecast.bp)
        app.register_blueprint(rebalancer.bp, url_prefix='/api')
        app.register_blueprint(store_inventory_summary.store_inventory_bp)
        # Remove url_prefix here since it's already defined in the blueprint
        app.register_blueprint(weeks_of_supply.weeks_of_supply_bp)
        app.register_blueprint(chatbot.bp)
        
        print("✅ All blueprints registered successfully!")
        
    except ImportError as e:
        print(f"❌ Blueprint import error: {str(e)}")
        raise
    except Exception as e:
        print(f"❌ Blueprint registration error: {str(e)}")
        raise

    return app