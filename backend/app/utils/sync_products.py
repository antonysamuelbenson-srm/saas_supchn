from app.models.inventory import Inventory
from app.models.products import Products
from app import db

def sync_products():
    """
    Fetch distinct store_id and sku from inventory 
    and insert into product_sync table.
    """
    # fetch distinct combinations
    results = db.session.query(
        Inventory.store_id,
        Inventory.sku
    ).distinct().all()
    
    # clear old entries (optional, if you want a fresh sync each time)
    db.session.query(Products).delete()
    
    # insert new
    for store_id, sku in results:
        product = Products(store_id=store_id, sku=sku)
        db.session.add(product)
    
    db.session.commit()
    return f"{len(results)} products synced!"
