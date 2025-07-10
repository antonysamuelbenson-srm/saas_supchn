# init_inventory.py

from app import create_app, db
from app.models.inventory import InventorySnapshot
from datetime import datetime
import uuid

app = create_app()

with app.app_context():
    # Ensure table exists
    db.create_all()

    try:
        db.session.add_all([
            InventorySnapshot(
                id=str(uuid.uuid4()),
                sku="SKU001",
                store_id="STORE01",
                product_name="Shampoo",
                quantity=100,
                last_updated=datetime.utcnow()
            ),
            InventorySnapshot(
                id=str(uuid.uuid4()),
                sku="SKU002",
                store_id="STORE02",
                product_name="Toothpaste",
                quantity=50,
                last_updated=datetime.utcnow()
            ),
            InventorySnapshot(
                id=str(uuid.uuid4()),
                sku="SKU003",
                store_id="STORE01",
                product_name="Soap",
                quantity=0,  # Triggers stockout alert
                last_updated=datetime.utcnow()
            )
        ])

        db.session.commit()
        print("✅ Test inventory data inserted into inventory_snapshot")
    except Exception as e:
        db.session.rollback()
        print("❌ Error inserting test inventory data:", e)
