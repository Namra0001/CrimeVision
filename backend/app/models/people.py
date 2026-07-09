from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ComplainantDetails(Base):
    ComplainantID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    ComplainantName = Column(String)
    AgeYear = Column(Integer)
    OccupationID = Column(Integer, ForeignKey("occupationmaster.OccupationID"))
    ReligionID = Column(Integer, ForeignKey("religionmaster.ReligionID"))
    CasteID = Column(Integer, ForeignKey("castemaster.caste_master_id"))
    GenderID = Column(Integer)

class Victim(Base):
    VictimMasterID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    VictimName = Column(String)
    AgeYear = Column(Integer)
    GenderID = Column(Integer)
    VictimPolice = Column(String) # If Victim is police then 1 else 0

class Accused(Base):
    AccusedMasterID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    AccusedName = Column(String)
    AgeYear = Column(Integer)
    GenderID = Column(Integer)
    PersonID = Column(String) # Sorting A1, A2...
    RepeatOffender = Column(Boolean)
    GangID = Column(String)
    Phone = Column(String)

class ArrestSurrender(Base):
    ArrestSurrenderID = Column(Integer, primary_key=True, index=True)
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"))
    ArrestSurrenderTypeID = Column(Integer)
    ArrestSurrenderDate = Column(Date)
    ArrestSurrenderStateId = Column(Integer, ForeignKey("state.StateID"))
    ArrestSurrenderDistrictId = Column(Integer, ForeignKey("district.DistrictID"))
    PoliceStationID = Column(Integer, ForeignKey("unit.UnitID"))
    IOID = Column(Integer, ForeignKey("employee.EmployeeID"))
    CourtID = Column(Integer, ForeignKey("court.CourtID"))
    AccusedMasterID = Column(Integer, ForeignKey("accused.AccusedMasterID"))
    IsAccused = Column(Boolean)
    IsComplainantAccused = Column(Boolean)
