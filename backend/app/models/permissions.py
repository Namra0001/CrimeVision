from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.base_class import Base
from app.models.user import UserRole

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(Enum(UserRole), index=True, nullable=False)
    module = Column(String, index=True, nullable=False)
    can_view = Column(Boolean, default=False)
    can_create = Column(Boolean, default=False)
    can_update = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
