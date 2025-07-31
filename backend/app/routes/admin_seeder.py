from app import db
from app.models.user import User
from app.models.roles import Role
from flask_bcrypt import Bcrypt
import uuid

bcrypt = Bcrypt()

def create_admin():
    role = Role.query.filter_by(role="admin").first()
    if not role:
        role = Role(role="admin")
        db.session.add(role)
        db.session.commit()

    hashed_pw = bcrypt.generate_password_hash("supersecureadminpassword").decode("utf-8")

    admin = User(
        email="admin@gmail.com",
        password=hashed_pw,
        role_id=role.id,
        role_user_id=str(uuid.uuid4())
    )
    db.session.add(admin)
    db.session.commit()
    print("Admin created.")

if __name__ == "__main__":
    create_admin()


# after deployment this script runs once to create an admin user