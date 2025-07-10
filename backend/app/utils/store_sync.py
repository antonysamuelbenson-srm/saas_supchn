from app import db
from app.models.inventory import InventorySnapshot
from app.models.store import Store

def sync_store_products_from_snapshot(role_user_id):
    """
    Sync unique (store_name, store_location, product_name) combinations
    with latest data from InventorySnapshot into the stores table.
    """
    unique_entries = (
        db.session.query(
            InventorySnapshot.sku,
            InventorySnapshot.product_name,
            InventorySnapshot.quantity,
            InventorySnapshot.store_name,
            InventorySnapshot.store_location
        )
        .filter(InventorySnapshot.role_user_id == role_user_id)
        .distinct()
        .all()
    )

    for sku, product_name, quantity, store_name, store_location in unique_entries:
        # Check if this exact record already exists
        exists = db.session.query(Store).filter_by(
            sku=sku,
            product_name=product_name,
            quantity=quantity,
            store_name=store_name,
            location=store_location,
            role_user_id=role_user_id
        ).first()

        if not exists:
            new_store = Store(
                sku=sku,
                product_name=product_name,
                quantity=quantity,
                store_name=store_name,
                location=store_location,
                role_user_id=role_user_id
            )
            db.session.add(new_store)

    db.session.commit()

def populate_store_ids(role_user_id=None):
    query = InventorySnapshot.query.filter(InventorySnapshot.store_id == None)
    if role_user_id:
        query = query.filter_by(role_user_id=role_user_id)

    snapshots = query.all()

    for snap in snapshots:
        store = Store.query.filter_by(
            store_name=snap.store_name,
            location=snap.store_location,
            sku=snap.sku,
            role_user_id=snap.role_user_id
        ).first()

        if store:
            snap.store_id = store.store_id
        else:
            print(f"⚠️ No store found for: {snap.store_name} - {snap.store_location} - {snap.sku}")

    db.session.commit()
    print("✅ store_id populated in InventorySnapshot.")
