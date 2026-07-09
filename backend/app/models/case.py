from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Act(Base):
    ActCode = Column(String, primary_key=True, index=True)
    ActDescription = Column(String)
    ShortName = Column(String)
    Active = Column(Integer) # 1=Active, 0=Inactive

class Section(Base):
    SectionCode = Column(String, primary_key=True, index=True)
    ActCode = Column(String, ForeignKey("act.ActCode"))
    SectionDescription = Column(String)
    Active = Column(Integer)

class CrimeHead(Base):
    CrimeHeadID = Column(Integer, primary_key=True, index=True)
    CrimeGroupName = Column(String)
    Active = Column(Integer)

class CrimeSubHead(Base):
    CrimeSubHeadID = Column(Integer, primary_key=True, index=True)
    CrimeHeadID = Column(Integer, ForeignKey("crimehead.CrimeHeadID"))
    CrimeHeadName = Column(String)
    SeqID = Column(Integer)

class CaseMaster(Base):
    CaseMasterID = Column(Integer, primary_key=True, index=True)
    CrimeNo = Column(String, index=True)
    CaseNo = Column(String, index=True)
    CrimeRegisteredDate = Column(Date)
    
    # Foreign Keys
    PolicePersonID = Column(Integer, ForeignKey("employee.EmployeeID"))
    PoliceStationID = Column(Integer, ForeignKey("unit.UnitID"))
    CaseCategoryID = Column(Integer, ForeignKey("casecategory.CaseCategoryID"))
    GravityOffenceID = Column(Integer, ForeignKey("gravityoffence.GravityOffenceID"))
    CrimeMajorHeadID = Column(Integer, ForeignKey("crimehead.CrimeHeadID"))
    CrimeMinorHeadID = Column(Integer, ForeignKey("crimesubhead.CrimeSubHeadID"))
    CaseStatusID = Column(Integer, ForeignKey("casestatusmaster.CaseStatusID"))
    CourtID = Column(Integer, ForeignKey("court.CourtID"))
    
    # Incident Details
    IncidentFromDate = Column(DateTime)
    IncidentToDate = Column(DateTime)
    InfoReceivedPSDate = Column(DateTime)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    BriefFacts = Column(String) # For Nvarchar(Max)
    # geom = Column(Geometry(geometry_type='POINT', srid=4326))

class ActSectionAssociation(Base):
    CaseMasterID = Column(Integer, ForeignKey("casemaster.CaseMasterID"), primary_key=True)
    ActID = Column(String, ForeignKey("act.ActCode"), primary_key=True) # Assuming ActID maps to ActCode
    SectionID = Column(String, ForeignKey("section.SectionCode"), primary_key=True)
    ActOrderID = Column(Integer)
    SectionOrderID = Column(Integer)
