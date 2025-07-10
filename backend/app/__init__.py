from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # <-- ✅ Import CORS here
from dotenv import load_dotenv
from flask_cors import CORS
import os


load_dotenv()

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
    CORS(app)
    db.init_app(app)

    # ✅ Enable CORS for all routes and origins
    CORS(app, resources={r"/*": {"origins": "*"}})

    # ✅ Register Blueprints
    from app.routes import auth, dashboard, alerts, upload, config, store_upload
    app.register_blueprint(auth.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(alerts.bp)
    app.register_blueprint(upload.bp)
    app.register_blueprint(config.bp)
    app.register_blueprint(store_upload.bp)

    return app

