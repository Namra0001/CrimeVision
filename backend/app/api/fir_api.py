from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import uuid
import random

from app.api.deps import get_db
from app.models.case import CaseMaster
from app.models.people import ComplainantDetails, Victim, Accused
from pydantic import BaseModel
from typing import Optional, List
from deep_translator import GoogleTranslator

router = APIRouter()

class FIRPayload(BaseModel):
    # Case Details
    district: Optional[str] = None
    police_station: Optional[str] = None
    crime_no: str
    incident_date: str
    case_category: Optional[str] = None
    latitude: float
    longitude: float
    brief_facts: str
    
    # Complainant Info
    complainant_name: str
    complainant_age: Optional[int] = None
    complainant_gender: str
    
    # Victim Info
    victim_name: Optional[str] = None
    victim_age: Optional[int] = None
    victim_gender: Optional[str] = None
    
    # Accused Info
    accused_name: Optional[str] = None
    accused_age: Optional[int] = None
    accused_gender: Optional[str] = None

from app.api.dashboard_api import STATS_CACHE
from app.models.case import CaseMaster, CrimeHead
from app.models.entities import Unit

@router.post("/add")
def add_fir(payload: FIRPayload, db: Session = Depends(get_db)):
    try:
        # Generate some IDs
        case_id = db.query(func.max(CaseMaster.CaseMasterID)).scalar() or 0
        case_id += 1
        
        # Lookup CrimeHeadID
        crime_head = db.query(CrimeHead).filter(CrimeHead.CrimeGroupName == payload.case_category).first()
        crime_head_id = crime_head.CrimeHeadID if crime_head else 1
        
        # Lookup PoliceStationID
        police_station = db.query(Unit).filter(Unit.UnitName == payload.police_station).first() if payload.police_station else None
        police_station_id = police_station.UnitID if police_station else 1
        
        # 1. Insert CaseMaster
        new_case = CaseMaster(
            CaseMasterID=case_id,
            CrimeNo=payload.crime_no,
            CaseNo=f"CASE-{case_id}",
            CrimeRegisteredDate=datetime.now().date(),
            InfoReceivedPSDate=datetime.now(),
            IncidentFromDate=datetime.strptime(payload.incident_date, "%Y-%m-%d"),
            latitude=payload.latitude,
            longitude=payload.longitude,
            BriefFacts=payload.brief_facts,
            PoliceStationID=police_station_id,
            CaseCategoryID=1 if payload.case_category == "Murder" else 2,
            CrimeMajorHeadID=crime_head_id,
            CaseStatusID=1 # Under Investigation (Pending)
        )
        db.add(new_case)
        db.commit()
        
        # 2. Insert Complainant
        comp_id = db.query(func.max(ComplainantDetails.ComplainantID)).scalar() or 0
        comp_id += 1
        new_comp = ComplainantDetails(
            ComplainantID=comp_id,
            CaseMasterID=case_id,
            ComplainantName=payload.complainant_name,
            AgeYear=payload.complainant_age,
            GenderID=1 if payload.complainant_gender == 'Male' else (2 if payload.complainant_gender == 'Female' else 3)
        )
        db.add(new_comp)
        
        # 3. Insert Victim if present
        if payload.victim_name:
            vic_id = db.query(func.max(Victim.VictimMasterID)).scalar() or 0
            vic_id += 1
            new_vic = Victim(
                VictimMasterID=vic_id,
                CaseMasterID=case_id,
                VictimName=payload.victim_name,
                AgeYear=payload.victim_age,
                GenderID=1 if payload.victim_gender == 'Male' else (2 if payload.victim_gender == 'Female' else 3)
            )
            db.add(new_vic)
            
        # 4. Insert Accused if present
        if payload.accused_name:
            acc_id = db.query(func.max(Accused.AccusedMasterID)).scalar() or 0
            acc_id += 1
            new_acc = Accused(
                AccusedMasterID=acc_id,
                CaseMasterID=case_id,
                AccusedName=payload.accused_name,
                AgeYear=payload.accused_age,
                GenderID=1 if payload.accused_gender == 'Male' else (2 if payload.accused_gender == 'Female' else 3)
            )
            db.add(new_acc)
            
        db.commit()
        STATS_CACHE.clear()
        return {"status": "success", "message": "FIR added successfully", "case_id": case_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/details/{crime_no:path}")
def get_fir_details(crime_no: str, db: Session = Depends(get_db)):
    case = db.query(CaseMaster).filter(CaseMaster.CrimeNo == crime_no).first()
    if not case:
        raise HTTPException(status_code=404, detail="FIR not found")
        
    crime_head = db.query(CrimeHead).filter(CrimeHead.CrimeHeadID == case.CrimeMajorHeadID).first()
    station = db.query(Unit).filter(Unit.UnitID == case.PoliceStationID).first()
    
    comp = db.query(ComplainantDetails).filter(ComplainantDetails.CaseMasterID == case.CaseMasterID).first()
    vic = db.query(Victim).filter(Victim.CaseMasterID == case.CaseMasterID).first()
    acc = db.query(Accused).filter(Accused.CaseMasterID == case.CaseMasterID).first()
    
    def get_gender(gid):
        if gid == 1: return "Male"
        if gid == 2: return "Female"
        if gid == 3: return "Other"
        return "Unknown"
        
    from app.models.lookups import CaseStatusMaster
    status_obj = db.query(CaseStatusMaster).filter(CaseStatusMaster.CaseStatusID == case.CaseStatusID).first()
    status_name = status_obj.CaseStatusName if status_obj else "Unknown"
    return {
        "crime_no": case.CrimeNo,
        "incident_date": case.IncidentFromDate.strftime("%Y-%m-%d") if case.IncidentFromDate else "",
        "case_category": crime_head.CrimeGroupName if crime_head else "Unknown",
        "police_station": station.UnitName if station else "Unknown",
        "latitude": case.latitude,
        "longitude": case.longitude,
        "brief_facts": case.BriefFacts or "",
        "complainant_name": comp.ComplainantName if comp else "",
        "complainant_age": comp.AgeYear if comp else None,
        "complainant_gender": get_gender(comp.GenderID) if comp else "",
        "victim_name": vic.VictimName if vic else "",
        "victim_age": vic.AgeYear if vic else None,
        "victim_gender": get_gender(vic.GenderID) if vic else "",
        "accused_name": acc.AccusedName if acc else "",
        "accused_age": acc.AgeYear if acc else None,
        "accused_gender": get_gender(acc.GenderID) if acc else "",
        "status": status_name,
    }

class TranslatePayload(BaseModel):
    text: str

@router.post("/translate")
def translate_text(payload: TranslatePayload):
    if not payload.text or not payload.text.strip():
        return {"translated_text": payload.text}
        
    try:
        translator = GoogleTranslator(source='auto', target='en')
        translated = translator.translate(payload.text)
        return {"translated_text": translated}
    except Exception as e:
        print(f"Translation error: {e}")
        return {"translated_text": payload.text}


@router.post("/solve/{crime_no:path}")
def solve_fir(crime_no: str, db: Session = Depends(get_db)):
    case = db.query(CaseMaster).filter(CaseMaster.CrimeNo == crime_no).first()
    if not case:
        raise HTTPException(status_code=404, detail="FIR not found")
        
    # 'Closed' status is usually 2 or 6. Let's find it.
    from app.models.lookups import CaseStatusMaster
    closed_status = db.query(CaseStatusMaster).filter(CaseStatusMaster.CaseStatusName == 'Closed').first()
    
    if closed_status:
        case.CaseStatusID = closed_status.CaseStatusID
    else:
        # Fallback if 'Closed' not found exactly
        case.CaseStatusID = 2 
        
    try:
        db.commit()
        STATS_CACHE.clear()
        return {"status": "success", "message": "Case marked as solved."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
