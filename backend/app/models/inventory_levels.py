# app/models/inventory_levels.py
from app import db
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import UniqueConstraint, CheckConstraint, Index
from datetime import datetime

class StoreInventoryLevel(db.Model):
    __tablename__ = 'store_inventory_levels'

    # Primary key - auto-incrementing ID
    id = db.Column(db.Integer, primary_key=True)
    
    # Foreign Keys
    store_id = db.Column(db.Integer, db.ForeignKey('store_data.store_id'), nullable=False)
    sku = db.Column(db.String(50), nullable=False, index=True)
    
    # Inventory Data
    current_inventory = db.Column(db.Integer, nullable=False, default=0)
    max_capacity = db.Column(db.Integer, nullable=False)
    target_level = db.Column(db.Integer, nullable=False)
    safety_stock = db.Column(db.Integer, nullable=False, default=0)
    
    # Calculated Fields
    inventory_percentage = db.Column(db.Numeric(5, 2), nullable=False)  # 0.00 to 100.00
    level_category = db.Column(
        db.Enum('Low', 'Medium', 'High', name='inventory_level_category'),
        nullable=False,
        index=True
    )
    
    # Status and Metadata
    operational_status = db.Column(
        db.Enum('Active', 'Inactive', 'Maintenance', name='operational_status'),
        nullable=False,
        default='Active'
    )
    last_updated = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Audit Trail
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Optional: Who updated this record
    updated_by = db.Column(
        PG_UUID(as_uuid=True),
        db.ForeignKey("user.role_user_id"),
        nullable=True
    )

    # Relationships
    store = db.relationship("Store", backref="inventory_levels")
    updater = db.relationship("User", foreign_keys=[updated_by])

    # Constraints
    __table_args__ = (
        # Ensure unique combination of store and SKU
        UniqueConstraint("store_id", "sku", name="uniq_store_sku_inventory"),
        
        # Check constraints for data integrity
        CheckConstraint(current_inventory >= 0, name="check_current_inventory_positive"),
        CheckConstraint(max_capacity > 0, name="check_max_capacity_positive"),
        CheckConstraint(target_level > 0, name="check_target_level_positive"),
        CheckConstraint(safety_stock >= 0, name="check_safety_stock_positive"),
        CheckConstraint(inventory_percentage >= 0, name="check_inventory_percentage_positive"),
        CheckConstraint(inventory_percentage <= 100, name="check_inventory_percentage_max"),
        CheckConstraint(target_level <= max_capacity, name="check_target_level_within_capacity"),
        CheckConstraint(safety_stock <= target_level, name="check_safety_stock_within_target"),
        
        # Indexes for performance
        Index('idx_store_inventory_levels_store_category', 'store_id', 'level_category'),
        Index('idx_store_inventory_levels_sku_category', 'sku', 'level_category'),
        Index('idx_store_inventory_levels_percentage', 'inventory_percentage'),
        Index('idx_store_inventory_levels_last_updated', 'last_updated'),
    )

    def __repr__(self):
        return f'<StoreInventoryLevel store_id={self.store_id} sku={self.sku} level={self.level_category}>'

    @property
    def available_capacity(self):
        """Calculate available capacity"""
        return max(0, self.max_capacity - self.current_inventory)
    
    @property
    def excess_over_safety(self):
        """Calculate excess inventory over safety stock"""
        return max(0, self.current_inventory - self.safety_stock)
    
    @property
    def units_to_target(self):
        """Calculate units needed to reach target level"""
        return max(0, self.target_level - self.current_inventory)
    
    @property
    def units_over_target(self):
        """Calculate units over target level"""
        return max(0, self.current_inventory - self.target_level)
    
    @property
    def is_low_stock(self):
        """Check if inventory is below safety stock"""
        return self.current_inventory < self.safety_stock
    
    @property
    def is_overstocked(self):
        """Check if inventory exceeds target level"""
        return self.current_inventory > self.target_level
    
    @property
    def stock_status(self):
        """Get comprehensive stock status"""
        if self.is_low_stock:
            return "Critical - Below Safety Stock"
        elif self.current_inventory < self.target_level:
            return "Low - Below Target"
        elif self.current_inventory > self.target_level:
            return "High - Above Target"
        else:
            return "Optimal"

    @classmethod
    def get_by_category(cls, category):
        """Get all inventory levels by category"""
        return cls.query.filter_by(level_category=category, operational_status='Active').all()
    
    @classmethod
    def get_by_store(cls, store_id):
        """Get all inventory levels for a specific store"""
        return cls.query.filter_by(store_id=store_id, operational_status='Active').all()
    
    @classmethod
    def get_low_stock_items(cls, store_id=None):
        """Get items that are below safety stock"""
        query = cls.query.filter(
            cls.current_inventory < cls.safety_stock,
            cls.operational_status == 'Active'
        )
        if store_id:
            query = query.filter_by(store_id=store_id)
        return query.all()
    
    @classmethod
    def get_overstocked_items(cls, store_id=None):
        """Get items that are overstocked"""
        query = cls.query.filter(
            cls.current_inventory > cls.target_level,
            cls.operational_status == 'Active'
        )
        if store_id:
            query = query.filter_by(store_id=store_id)
        return query.all()
    
    @classmethod
    def get_summary_stats(cls):
        """Get summary statistics for inventory levels"""
        from sqlalchemy import func
        
        return db.session.query(
            cls.level_category,
            func.count().label('store_count'),
            func.round(func.avg(cls.inventory_percentage), 2).label('avg_percentage'),
            func.round(func.min(cls.inventory_percentage), 2).label('min_percentage'),
            func.round(func.max(cls.inventory_percentage), 2).label('max_percentage'),
            func.sum(cls.current_inventory).label('total_inventory'),
            func.sum(cls.max_capacity).label('total_capacity')
        ).filter(cls.operational_status == 'Active').group_by(cls.level_category).all()

    def update_inventory(self, new_quantity, updated_by_user_id=None):
        """Update inventory quantity and recalculate derived fields"""
        self.current_inventory = new_quantity
        self.inventory_percentage = round((new_quantity / self.max_capacity) * 100, 2) if self.max_capacity > 0 else 0
        
        # Update category based on percentage
        if self.inventory_percentage < 20:
            self.level_category = 'Low'
        elif self.inventory_percentage <= 80:
            self.level_category = 'Medium'
        else:
            self.level_category = 'High'
        
        self.last_updated = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        if updated_by_user_id:
            self.updated_by = updated_by_user_id
    
    def to_dict(self):
        """Convert model to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'store_id': self.store_id,
            'sku': self.sku,
            'current_inventory': self.current_inventory,
            'max_capacity': self.max_capacity,
            'target_level': self.target_level,
            'safety_stock': self.safety_stock,
            'inventory_percentage': float(self.inventory_percentage),
            'level_category': self.level_category,
            'operational_status': self.operational_status,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Calculated properties
            'available_capacity': self.available_capacity,
            'excess_over_safety': self.excess_over_safety,
            'units_to_target': self.units_to_target,
            'units_over_target': self.units_over_target,
            'stock_status': self.stock_status,
            'is_low_stock': self.is_low_stock,
            'is_overstocked': self.is_overstocked
        }