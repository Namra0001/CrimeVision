from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class State(Base):
    StateID = Column(Integer, primary_key=True, index=True)
    StateName = Column(String, index=True)
    NationalityID = Column(Integer)
    Active = Column(Boolean, default=True)

class District(Base):
    DistrictID = Column(Integer, primary_key=True, index=True)
    DistrictName = Column(String, index=True)
    StateID = Column(Integer, ForeignKey("state.StateID"))
    Active = Column(Boolean, default=True)
    
    state = relationship("State")

class Court(Base):
    CourtID = Column(Integer, primary_key=True, index=True)
    CourtName = Column(String)
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    StateID = Column(Integer, ForeignKey("state.StateID"))
    Active = Column(Boolean, default=True)

class UnitType(Base):
    UnitTypeID = Column(Integer, primary_key=True, index=True)
    UnitTypeName = Column(String) # e.g. Police Station, Circle Office
    CityDistState = Column(String)

class Rank(Base):
    RankID = Column(Integer, primary_key=True, index=True)
    RankName = Column(String)
    Hierarchy = Column(Integer)
    Active = Column(Boolean, default=True)

class Designation(Base):
    DesignationID = Column(Integer, primary_key=True, index=True)
    DesignationName = Column(String)
    Active = Column(Boolean, default=True)
    SortOrder = Column(Integer)

class CasteMaster(Base):
    caste_master_id = Column(Integer, primary_key=True, index=True)
    caste_master_name = Column(String)

class ReligionMaster(Base):
    ReligionID = Column(Integer, primary_key=True, index=True)
    ReligionName = Column(String)

class OccupationMaster(Base):
    OccupationID = Column(Integer, primary_key=True, index=True)
    OccupationName = Column(String)

class CaseStatusMaster(Base):
    CaseStatusID = Column(Integer, primary_key=True, index=True)
    CaseStatusName = Column(String)

class GravityOffence(Base):
    GravityOffenceID = Column(Integer, primary_key=True, index=True)
    LookupValue = Column(String)

class CaseCategory(Base):
    CaseCategoryID = Column(Integer, primary_key=True, index=True)
    LookupValue = Column(String)
