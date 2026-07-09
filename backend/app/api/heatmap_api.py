from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from pydantic import BaseModel
import random
from datetime import datetime

from app.db.session import SessionLocal
from app.api.deps import get_db
from app.models.case import CaseMaster, CrimeHead, CrimeSubHead
from app.models.entities import Unit
from app.models.lookups import District, GravityOffence, CaseStatusMaster

router = APIRouter()

class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float

class CrimeLocation(BaseModel):
    case_no: str
    crime_no: Optional[str] = None
    fir_no: Optional[str] = None
    crime_type: str
    crime_head: Optional[str] = None
    crime_sub_head: Optional[str] = None
    severity: str
    status: Optional[str] = None
    victim: Optional[str] = None
    accused_count: Optional[int] = 0
    officer: Optional[str] = None
    police_station: Optional[str] = None
    district: str
    date: str
    time: Optional[str] = None
    lat: float
    lng: float
    risk_score: Optional[int] = 0
    prediction: Optional[str] = None
    suggested_action: Optional[str] = None

class DistrictResponse(BaseModel):
    id: int
    name: str

class StationResponse(BaseModel):
    id: int
    name: str

class HighRiskAreaResponse(BaseModel):
    area_name: str
    district_name: str
    case_count: int

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    time: str
    type: str

class SummaryResponse(BaseModel):
    total_crimes: int
    pending_cases: int
    solved_cases: int
    active_investigations: int
    high_risk_areas: int
    womens_safety_score: int

@router.get("/summary", response_model=SummaryResponse)
def get_map_summary(
    district_id: Optional[int] = None,
    station_id: Optional[int] = None,
    crime_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    high_risk_only: Optional[bool] = False,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CaseMaster).join(
        CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID, isouter=True
    ).join(
        GravityOffence, CaseMaster.GravityOffenceID == GravityOffence.GravityOffenceID, isouter=True
    ).join(
        CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID, isouter=True
    ).filter(
        CaseMaster.latitude != None,
        CaseMaster.longitude != None,
        CaseMaster.longitude > 74.6, 
        CaseMaster.latitude > 11.5
    )

    if district_id or station_id:
        query = query.join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        if district_id:
            query = query.filter(Unit.DistrictID == district_id)
        if station_id:
            query = query.filter(Unit.UnitID == station_id)

    if crime_type:
        query = query.filter(CrimeHead.CrimeGroupName.ilike(f"%{crime_type}%"))
    if severity:
        query = query.filter(GravityOffence.LookupValue.ilike(f"%{severity}%"))
    if status:
        if status.lower() == "closed":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Closed', 'Chargesheeted', 'Convicted', 'Acquitted']))
        elif status.lower() == "pending":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Under Investigation', 'Pending Trial']))
        else:
            query = query.filter(CaseStatusMaster.CaseStatusName.ilike(f"%{status}%"))
    
    if from_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate >= datetime.strptime(from_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if to_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate <= datetime.strptime(to_date, "%Y-%m-%d").date())
        except ValueError:
            pass

    if high_risk_only:
        station_counts = db.query(
            Unit.UnitID,
            func.count(CaseMaster.CaseMasterID).label('total')
        ).join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
        .filter(
            CaseMaster.latitude != None,
            CaseMaster.longitude > 74.6, 
            CaseMaster.latitude > 11.5
        )\
        .group_by(Unit.UnitID).subquery()
        
        high_risk_stations = db.query(station_counts.c.UnitID).filter(
            station_counts.c.total > 30
        ).subquery()
        
        if not (district_id or station_id):
            query = query.join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)
        query = query.filter(Unit.UnitID.in_(high_risk_stations))

    total = query.count()
    
    # Solved cases: Closed, Chargesheeted, Convicted, Acquitted
    solved = query.filter(CaseStatusMaster.CaseStatusName.in_(['Closed', 'Chargesheeted', 'Convicted', 'Acquitted'])).count()
    
    # Pending cases: Under Investigation, Pending Trial
    pending = query.filter(CaseStatusMaster.CaseStatusName.in_(['Under Investigation', 'Pending Trial'])).count()
    
    # High risk areas: count of stations with > 30 cases
    all_station_counts = db.query(
        Unit.UnitID,
        func.count(CaseMaster.CaseMasterID).label('total')
    ).join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
    .filter(
        CaseMaster.latitude != None,
        CaseMaster.longitude > 74.6, 
        CaseMaster.latitude > 11.5
    )\
    .group_by(Unit.UnitID).subquery()
    
    high_risk = db.query(all_station_counts).filter(all_station_counts.c.total > 30).count()

    return {
        "total_crimes": total,
        "pending_cases": pending,
        "solved_cases": solved,
        "active_investigations": pending,
        "high_risk_areas": high_risk,
        "womens_safety_score": random.randint(60, 95)
    }

@router.get("/district", response_model=List[DistrictResponse])
def get_districts(db: Session = Depends(get_db)):
    districts = db.query(District).filter(District.Active == True).all()
    return [{"id": d.DistrictID, "name": d.DistrictName} for d in districts]

@router.get("/police-stations", response_model=List[StationResponse])
def get_police_stations(district_id: int, db: Session = Depends(get_db)):
    units = db.query(Unit).filter(Unit.DistrictID == district_id).all()
    return [{"id": u.UnitID, "name": u.UnitName} for u in units]

@router.get("/high-risk-areas", response_model=List[HighRiskAreaResponse])
def get_high_risk_areas(db: Session = Depends(get_db)):
    # Areas with > 50 cases
    results = db.query(
        Unit.UnitName.label("area_name"),
        District.DistrictName.label("district_name"),
        func.count(CaseMaster.CaseMasterID).label("case_count")
    ).join(
        CaseMaster, CaseMaster.PoliceStationID == Unit.UnitID
    ).join(
        District, Unit.DistrictID == District.DistrictID
    ).group_by(
        Unit.UnitName, District.DistrictName
    ).having(
        func.count(CaseMaster.CaseMasterID) > 50
    ).order_by(
        func.count(CaseMaster.CaseMasterID).desc()
    ).all()

    return [{"area_name": r.area_name, "district_name": r.district_name, "case_count": r.case_count} for r in results]


@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    # Find district with most cases
    result = db.query(
        District.DistrictName, 
        func.count(CaseMaster.CaseMasterID).label("count")
    ).join(
        Unit, CaseMaster.PoliceStationID == Unit.UnitID
    ).join(
        District, Unit.DistrictID == District.DistrictID
    ).group_by(District.DistrictName).order_by(func.count(CaseMaster.CaseMasterID).desc()).first()

    notifications = []
    if result:
        district_name = result[0]
        notifications.append({
            "id": 1,
            "title": "Active Patrol Vehicles Required",
            "message": f"High crime volume detected in {district_name}. Recommend deploying active patrol vehicles.",
            "time": "Just now",
            "type": "alert"
        })
    return notifications

@router.get("/crime-types", response_model=List[str])
def get_crime_types(db: Session = Depends(get_db)):
    types = db.query(CrimeHead.CrimeGroupName).filter(CrimeHead.CrimeGroupName != None).distinct().order_by(CrimeHead.CrimeGroupName).all()
    return [t[0] for t in types]

@router.get("/crime-location", response_model=List[CrimeLocation])
def get_crime_locations(
    district_id: Optional[int] = None,
    station_id: Optional[int] = None,
    crime_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    high_risk_only: Optional[bool] = False,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        CaseMaster.CaseNo,
        CaseMaster.CrimeNo,
        CrimeHead.CrimeGroupName.label("crime_type"),
        CrimeHead.CrimeGroupName.label("crime_head"),
        CaseMaster.CrimeRegisteredDate.label("date"),
        CaseMaster.IncidentFromDate.label("time"),
        CaseMaster.latitude,
        CaseMaster.longitude,
        District.DistrictName.label("district"),
        GravityOffence.LookupValue.label("severity"),
        Unit.UnitName.label("police_station"),
        CaseStatusMaster.CaseStatusName.label("status")
    ).join(
        CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID,
        isouter=True
    ).join(
        Unit, CaseMaster.PoliceStationID == Unit.UnitID,
        isouter=True
    ).join(
        District, Unit.DistrictID == District.DistrictID,
        isouter=True
    ).join(
        GravityOffence, CaseMaster.GravityOffenceID == GravityOffence.GravityOffenceID,
        isouter=True
    ).join(
        CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID,
        isouter=True
    ).filter(
        CaseMaster.latitude != None,
        CaseMaster.longitude != None,
        CaseMaster.longitude > 74.6, 
        CaseMaster.latitude > 11.5
    )

    if district_id:
        query = query.filter(District.DistrictID == district_id)
    if station_id:
        query = query.filter(Unit.UnitID == station_id)
    if crime_type:
        query = query.filter(CrimeHead.CrimeGroupName.ilike(f"%{crime_type}%"))
    if severity:
        query = query.filter(GravityOffence.LookupValue.ilike(f"%{severity}%"))
    if status:
        if status.lower() == "closed":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Closed', 'Chargesheeted', 'Convicted', 'Acquitted']))
        elif status.lower() == "pending":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Under Investigation', 'Pending Trial']))
        else:
            query = query.filter(CaseStatusMaster.CaseStatusName.ilike(f"%{status}%"))
            
    if from_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate >= datetime.strptime(from_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if to_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate <= datetime.strptime(to_date, "%Y-%m-%d").date())
        except ValueError:
            pass
        
    if high_risk_only:
        # Override to return exactly the high risk stations as locations
        station_counts = db.query(
            Unit.UnitName,
            District.DistrictName,
            func.avg(CaseMaster.latitude).label('lat'),
            func.avg(CaseMaster.longitude).label('lng'),
            func.count(CaseMaster.CaseMasterID).label('total')
        ).join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
        .join(District, Unit.DistrictID == District.DistrictID)\
        .filter(
            CaseMaster.latitude != None,
            CaseMaster.longitude > 74.6, 
            CaseMaster.latitude > 11.5
        )\
        .group_by(Unit.UnitName, District.DistrictName).all()
        
        locations = []
        for s in station_counts:
            if s.total > 30:
                locations.append({
                    "case_no": f"STATION ALERT",
                    "crime_no": f"Critical",
                    "fir_no": f"Total Cases: {s.total}",
                    "crime_type": "High Risk Area",
                    "crime_head": "Multiple",
                    "crime_sub_head": "N/A",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "time": "Active",
                    "lat": float(s.lat) if s.lat else 15.0,
                    "lng": float(s.lng) if s.lng else 75.0,
                    "district": s.DistrictName or "Unknown",
                    "severity": "High",
                    "status": "Pending",
                    "police_station": s.UnitName or "Unknown",
                    "victim": "Multiple",
                    "accused_count": int(s.total * 0.8),
                    "officer": "Station Commander",
                    "risk_score": min(99, 50 + s.total),
                    "prediction": f"Sustained high volume in {s.UnitName}",
                    "suggested_action": "Deploy additional units immediately"
                })
        return locations

    # Limit to 1000 to prevent overwhelming the browser
    results = query.limit(1000).all()

    locations = []
    for r in results:
        # Calculate a mock risk score based on severity
        risk_score = 50
        sev = (r.severity or "").lower()
        if "high" in sev or "heinous" in sev:
            risk_score = 90
        elif "low" in sev:
            risk_score = 20

        locations.append({
            "case_no": r.CaseNo or "Unknown",
            "crime_no": r.CrimeNo or "Unknown",
            "fir_no": r.CrimeNo or "Unknown",
            "crime_type": r.crime_type or "Unknown",
            "crime_head": r.crime_head or "Unknown",
            "crime_sub_head": "N/A",
            "date": str(r.date) if r.date else "Unknown",
            "time": r.time.strftime("%H:%M") if r.time else "Unknown",
            "lat": float(r.latitude),
            "lng": float(r.longitude),
            "district": r.district or "Unknown",
            "severity": r.severity or "Normal",
            "status": r.status or "Pending",
            "police_station": r.police_station or "Unknown",
            "victim": "Protected Profile",
            "accused_count": random.randint(0, 3),
            "officer": f"Inspector {random.choice(['Patil', 'Gowda', 'Kumar', 'Reddy', 'Rao'])}",
            "risk_score": risk_score,
            "prediction": f"75% chance of recurrence in 48h" if risk_score > 70 else "Low recurrence probability",
            "suggested_action": "Deploy Night Patrol" if risk_score > 70 else "Monitor via CCTV"
        })
    return locations

@router.get("/heatmap", response_model=List[HeatmapPoint])
def get_heatmap_data(
    district_id: Optional[int] = None,
    station_id: Optional[int] = None,
    crime_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    high_risk_only: Optional[bool] = False,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        CaseMaster.latitude,
        CaseMaster.longitude,
        GravityOffence.LookupValue.label("severity")
    ).join(
        Unit, CaseMaster.PoliceStationID == Unit.UnitID,
        isouter=True
    ).join(
        District, Unit.DistrictID == District.DistrictID,
        isouter=True
    ).join(
        GravityOffence, CaseMaster.GravityOffenceID == GravityOffence.GravityOffenceID,
        isouter=True
    ).filter(
        CaseMaster.latitude != None,
        CaseMaster.longitude != None,
        CaseMaster.longitude > 74.6, 
        CaseMaster.latitude > 11.5
    )

    if district_id or station_id:
        if district_id:
            query = query.filter(District.DistrictID == district_id)
        if station_id:
            query = query.filter(Unit.UnitID == station_id)

    if crime_type:
        query = query.join(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID, isouter=True)
        query = query.filter(CrimeHead.CrimeGroupName.ilike(f"%{crime_type}%"))
    if severity:
        query = query.filter(GravityOffence.LookupValue.ilike(f"%{severity}%"))
    if status:
        query = query.join(CaseStatusMaster, CaseMaster.CaseStatusID == CaseStatusMaster.CaseStatusID, isouter=True)
        if status.lower() == "closed":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Closed', 'Chargesheeted', 'Convicted', 'Acquitted']))
        elif status.lower() == "pending":
            query = query.filter(CaseStatusMaster.CaseStatusName.in_(['Under Investigation', 'Pending Trial']))
        else:
            query = query.filter(CaseStatusMaster.CaseStatusName.ilike(f"%{status}%"))
            
    if from_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate >= datetime.strptime(from_date, "%Y-%m-%d").date())
        except ValueError:
            pass
    if to_date:
        try:
            query = query.filter(CaseMaster.CrimeRegisteredDate <= datetime.strptime(to_date, "%Y-%m-%d").date())
        except ValueError:
            pass
            
    if high_risk_only:
        station_counts = db.query(
            Unit.UnitID,
            func.count(CaseMaster.CaseMasterID).label('total')
        ).join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
        .filter(
            CaseMaster.latitude != None,
            CaseMaster.longitude > 74.6, 
            CaseMaster.latitude > 11.5
        )\
        .group_by(Unit.UnitID).subquery()
        
        high_risk_stations = db.query(station_counts.c.UnitID).filter(
            station_counts.c.total > 30
        ).subquery()
        
        query = query.filter(Unit.UnitID.in_(high_risk_stations))

    results = query.limit(1000).all()

    points = []
    for r in results:
        intensity = 0.5
        severity_val = (r.severity or "").lower()
        if "high" in severity_val or "heinous" in severity_val:
            intensity = 1.0
        elif "low" in severity_val:
            intensity = 0.2
            
        points.append({
            "lat": float(r.latitude),
            "lng": float(r.longitude),
            "intensity": intensity
        })
    return points
