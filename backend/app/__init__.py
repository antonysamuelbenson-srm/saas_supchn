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
    ANON_KEY = os.getenv("ANON_KEY")

    from app.models import user
    db.init_app(app)
    # CORS(app, resources={r"/*": {"origins": "*"}})
    CORS(
        app,
        origins=["http://localhost:5173"],  # only allow your frontend
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True
    )

    # ✅ Register Blueprints INSIDE this function
    from app.routes import auth, dashboard, alerts, upload, config, store_upload, forecast_data, node_location_update, reorder, availability
    app.register_blueprint(auth.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(alerts.bp)
    app.register_blueprint(upload.bp)
    app.register_blueprint(config.bp)
    app.register_blueprint(store_upload.bp)
    app.register_blueprint(forecast_data.bp)
    app.register_blueprint(node_location_update.bp)
    app.register_blueprint(reorder.bp)
    app.register_blueprint(availability.bp)

    return app

