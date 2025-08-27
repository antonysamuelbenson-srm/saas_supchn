from datetime import datetime
from sqlalchemy import BigInteger, Enum, Date, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app import db


# Create the enum type once; SQLAlchemy will generate the DDL if it doesn't exist
batch_type_enum = Enum(
    "store", "inventory", "forecast",
    name="batch_type_enum",
    create_constraint=True,
    metadata=db.metadata,   # ensure it goes into migrations
)


class UploadBatch(db.Model):
    __tablename__ = "upload_batch"

    batch_id = db.Column(BigInteger, primary_key=True, autoincrement=True)

    role_user_id = db.Column(
        PG_UUID(as_uuid=True),
        db.ForeignKey("user.role_user_id"),
        nullable=False
    )

    batch_type = db.Column(batch_type_enum, nullable=False)  # 'store' | 'inventory' | 'forecast'
    original_filename = db.Column(Text, nullable=False)

    uploaded_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    effective_start_date = db.Column(Date, nullable=True)
    effective_end_date   = db.Column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<UploadBatch {self.batch_id} {self.batch_type}>"


