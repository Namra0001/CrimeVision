from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
import enum
from app.db.base_class import Base
from datetime import datetime

class UserRole(str, enum.Enum):
    CONSTABLE = "constable"
    INSPECTOR = "inspector"
    SP = "sp"
    CRIME_ANALYST = "crime_analyst"
    DGP = "dgp"
    ADMIN = "admin" # Kept for system administration

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    role = Column(Enum(UserRole), default=UserRole.CONSTABLE, nullable=False)
    station_id = Column(Integer, nullable=True) # For Constable and Inspector
    district_id = Column(Integer, nullable=True) # For SP
    status = Column(String, default="active")
    is_verified_by_admin = Column(Boolean(), default=False)

class OTPVerification(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String, nullable=False)
    purpose = Column(String, nullable=False) # "register" or "reset_password"
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
