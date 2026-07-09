import os
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash

database_url = os.getenv("DATABASE_URL")
engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed():
    db = SessionLocal()
    print("Seeding initial users...")
    
    users = [
        {"email": "constable@ksp.gov.in", "name": "Ramesh Kumar", "role": UserRole.CONSTABLE, "station_id": 1, "district_id": 1},
        {"email": "inspector@ksp.gov.in", "name": "Suresh Gowda", "role": UserRole.INSPECTOR, "station_id": 1, "district_id": 1},
        {"email": "sp@ksp.gov.in", "name": "Vikram Singh, IPS", "role": UserRole.SP, "station_id": None, "district_id": 1},
        {"email": "analyst@ksp.gov.in", "name": "Priya Data", "role": UserRole.CRIME_ANALYST, "station_id": None, "district_id": None},
        {"email": "admin@ksp.gov.in", "name": "System Admin", "role": UserRole.ADMIN, "station_id": None, "district_id": None},
    ]

    password = get_password_hash("KSP@2026")

    for u in users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            new_user = User(
                email=u["email"],
                full_name=u["name"],
                role=u["role"],
                hashed_password=password,
                station_id=u["station_id"],
                district_id=u["district_id"]
            )
            db.add(new_user)
            print(f"Created user {u['email']} with role {u['role']}")
        else:
            print(f"User {u['email']} already exists.")
            
    db.commit()
    db.close()
    print("Done!")

if __name__ == "__main__":
    seed()
