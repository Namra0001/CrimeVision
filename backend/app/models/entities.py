from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Unit(Base):
    UnitID = Column(Integer, primary_key=True, index=True)
    UnitName = Column(String)
    TypeID = Column(Integer, ForeignKey("unittype.UnitTypeID"))
    ParentUnit = Column(Integer) # self-referential
    NationalityID = Column(Integer)
    StateID = Column(Integer, ForeignKey("state.StateID"))
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    Active = Column(Boolean, default=True)

class Employee(Base):
    EmployeeID = Column(Integer, primary_key=True, index=True)
    DistrictID = Column(Integer, ForeignKey("district.DistrictID"))
    UnitID = Column(Integer, ForeignKey("unit.UnitID"))
    RankID = Column(Integer, ForeignKey("rank.RankID"))
    DesignationID = Column(Integer, ForeignKey("designation.DesignationID"))
    
    KGID = Column(String) # Karnataka Government ID
    FirstName = Column(String)
    EmployeeDOB = Column(Date)
    GenderID = Column(Integer)
    BloodGroupID = Column(Integer)
    PhysicallyChallenged = Column(Boolean)
    AppointmentDate = Column(Date)
