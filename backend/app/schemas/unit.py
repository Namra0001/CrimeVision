from pydantic import BaseModel
from typing import Optional

# Shared properties
class UnitBase(BaseModel):
    UnitName: str
    TypeID: Optional[int] = None
    ParentUnit: Optional[int] = None
    StateID: Optional[int] = None
    DistrictID: Optional[int] = None
    Active: bool = True

# Properties to receive on creation
class UnitCreate(UnitBase):
    pass

# Properties to receive on update
class UnitUpdate(UnitBase):
    pass

# Properties shared by models stored in DB
class UnitInDBBase(UnitBase):
    UnitID: int

    class Config:
        from_attributes = True

# Properties to return to client
class Unit(UnitInDBBase):
    pass
