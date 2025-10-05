from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from flask_cors import CORS
import os

load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    # This variable is loaded but not used, which is fine.
    ANON_KEY = os.getenv("ANON_KEY")

    # --- START: CORRECTED CORS CONFIGURATION ---
    # This is the most robust way to configure CORS for your API.
    # It specifically allows your frontend's origin and the headers/methods it needs.
    CORS(app,
         resources={r"/api/*": {
             "origins": "http://localhost:5173",  # The origin of your frontend app
             "methods": ["GET", "POST", "OPTIONS"],      # Methods your frontend will use
             "allow_headers": ["Content-Type", "Authorization"], # Headers your frontend sends
             "supports_credentials": True
         }})
    # --- END: CORRECTED CORS CONFIGURATION ---

    # Initialize extensions
    db.init_app(app)
    # CORS(app, resources={r"/*": {"origins": "*"}})
    # CORS(app, resources={r"/api/*": {
    #     "origins": "http://localhost:5173",
    #     "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    #     "allow_headers": ["Content-Type", "Authorization"],
    #     "supports_credentials": True
    # }})

    # Replace your current CORS line with this simpler version:
    CORS(app,
        origins="http://localhost:5173",
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True
    )



    # ✅ Register Blueprints INSIDE this function
    from app.routes import auth, dashboard, alerts, upload, config, store_upload, node_location_update, reorder, availability, admin, forecast, rebalancer, chatbot
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
    # Ensure this blueprint has the correct prefix for the CORS rule to apply
    app.register_blueprint(rebalancer.bp, url_prefix='/api')
    app.register_blueprint(chatbot.bp)

    return app
