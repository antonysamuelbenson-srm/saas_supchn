from flask import Blueprint, request, jsonify
import pandas as pd
from app import db
from app.models.inventory import InventorySnapshot
from app.utils.kpi_calc import generate_alerts  # ✅ alert trigger
from app.utils.jwt_utils import decode_jwt  # ✅ make sure this is imported
import uuid
from datetime import datetime

bp = Blueprint("upload", __name__)

@bp.route("/upload/validate", methods=["POST"])
def validate_file():
    # ✅ Get token inside the route
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    payload = decode_jwt(token)
    role_user_id = payload.get("role_user_id")

    if not role_user_id:
        return jsonify({"error": "Invalid or missing role_user_id"}), 401

    # ✅ Read CSV
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        df = pd.read_csv(file)
    except Exception as e:
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 400

    errors = []
    required_cols = ["SKU_ID", "Store_Code", "Product_Name", "Quantity"]
    for col in required_cols:
        if col not in df.columns:
            errors.append(f"Missing column: {col}")

    if df.isnull().values.any():
        errors.append("Contains missing values")

    if errors:
        return jsonify({"valid": False, "errors": errors}), 400

    # ✅ Insert rows into DB with role_user_id
    for _, row in df.iterrows():
        item = InventorySnapshot(
            role_user_id=role_user_id,
            sku=row["SKU_ID"],
            store_code=row["Store_Code"],
            product_name=row["Product_Name"],
            quantity=row["Quantity"],
            last_updated=datetime.utcnow()
        )
        db.session.add(item)

    db.session.commit()

    # ✅ Generate alerts for this user’s data
    alert_count = generate_alerts(role_user_id=role_user_id)

    return jsonify({
        "valid": True,
        "inserted": len(df),
        "alerts_triggered": alert_count
    })
