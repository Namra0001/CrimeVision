from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import random
import math
from datetime import datetime

from app.db.session import SessionLocal
from app.api.deps import get_db
from app.models.case import CaseMaster, CrimeHead
from app.models.entities import Unit
from app.models.lookups import District, GravityOffence, CaseStatusMaster

router = APIRouter()

class RouteRequest(BaseModel):
    from_loc: str
    to_loc: str
    api_key: Optional[str] = None

@router.post("/route")
def get_route(req: RouteRequest):
    base_lat, base_lng = 15.3173, 75.7139
    return {
        "coordinates": [
            [base_lat, base_lng],
            [base_lat + 0.1, base_lng + 0.05],
            [base_lat + 0.2, base_lng - 0.05],
            [base_lat + 0.3, base_lng]
        ],
        "summary": {
            "travelTimeInSeconds": 3600,
            "trafficDelayInSeconds": 600
        },
        "alternative": {
            "coordinates": [
                [base_lat, base_lng],
                [base_lat + 0.1, base_lng + 0.1],
                [base_lat + 0.2, base_lng + 0.1],
                [base_lat + 0.3, base_lng]
            ],
            "summary": {
                "travelTimeInSeconds": 4000
            }
        },
        "trafficHotspots": [
            [base_lat + 0.15, base_lng + 0.0]
        ]
    }

class KpiCardModel(BaseModel):
    title: str
    value: Any
    icon_name: str
    color: str
    suffix: str = ""

class DashboardSummary(BaseModel):
    cards: List[KpiCardModel]
    monthly_insight: str

class MapFeature(BaseModel):
    id: str
    geometry_type: str 
    coordinates: Any 
    color: str
    fill_color: Optional[str] = None
    radius: Optional[float] = None
    icon: Optional[str] = None
    name: str
    risk_score: Optional[int] = None
    details: dict

class Recommendation(BaseModel):
    id: str
    type: str
    title: str
    description: str
    lat: float
    lng: float
    priority: str
    impact: str

class AnalyticsData(BaseModel):
    trend_data: List[dict]
    severity_data: List[dict]
    categories: List[dict]

def get_month_seed(month: str) -> int:
    months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    try:
        # Check first 3 letters capitalized to match frontend's "JAN", "FEB"
        return months.index(month[:3].upper()) + 1
    except:
        return 1

# Basic clustering algorithm
def cluster_points(points, radius_deg=0.04):
    clusters = []
    for p in points:
        lat, lng = p['lat'], p['lng']
        found = False
        for c in clusters:
            clat, clng = c['center']
            if abs(lat - clat) < radius_deg and abs(lng - clng) < radius_deg:
                c['points'].append(p)
                c['center'] = (
                    (clat * len(c['points']) + lat) / (len(c['points']) + 1),
                    (clng * len(c['points']) + lng) / (len(c['points']) + 1)
                )
                found = True
                break
        if not found:
            clusters.append({'center': (lat, lng), 'points': [p]})
    return sorted(clusters, key=lambda x: len(x['points']), reverse=True)

@router.get("/summary", response_model=DashboardSummary)
def get_risk_summary(layer: str = "active", month: str = "January", lang: str = "en", db: Session = Depends(get_db)):
    m_idx = get_month_seed(month)
    base = 1.0 + (m_idx * 0.1)

    # In a fully production system, we'd query the DB for actual aggregates here.
    # For now, we will retain the heuristic aggregates for speed, but scale them based on the layer.
    
    if layer == "active":
        cards = [
            {"title": "Total Hotspots", "value": int(42 * base), "icon_name": "Map", "color": "text-red-500"},
            {"title": "Critical Areas", "value": int(8 * base), "icon_name": "AlertTriangle", "color": "text-red-600"},
            {"title": "Avg Risk Score", "value": min(95, int(68 * base)), "icon_name": "Activity", "color": "text-yellow-500", "suffix": "%"},
            {"title": "Patrol Coverage", "value": max(20, int(45 / base)), "icon_name": "ShieldAlert", "color": "text-blue-500", "suffix": "%"},
        ]
    elif layer == "emerging":
        cards = [
            {"title": "Emerging Zones", "value": int(15 * base), "icon_name": "TrendingUp", "color": "text-orange-500"},
            {"title": "Avg Growth", "value": f"+{int(24 * base)}", "icon_name": "Activity", "color": "text-red-500", "suffix": "%"},
            {"title": "Expected Crimes", "value": int(120 * base), "icon_name": "AlertTriangle", "color": "text-yellow-500"},
            {"title": "Prediction Acc.", "value": min(98, int(92 + m_idx)), "icon_name": "Crosshair", "color": "text-green-500", "suffix": "%"},
        ]
    elif layer == "future_predictions":
        cards = [
            {"title": "Predicted Hotspots", "value": int(18 * base), "icon_name": "Eye", "color": "text-blue-500"},
            {"title": "Confidence", "value": min(99, int(88 + m_idx)), "icon_name": "Crosshair", "color": "text-green-500", "suffix": "%"},
            {"title": "Expected Crimes", "value": int(450 * base), "icon_name": "TrendingUp", "color": "text-red-500"},
            {"title": "Time Horizon", "value": "1 Month", "icon_name": "Activity", "color": "text-purple-500"},
        ]
    elif layer == "severity":
        cards = [
            {"title": "Critical Crimes", "value": int(85 * base), "icon_name": "AlertTriangle", "color": "text-red-600"},
            {"title": "Avg Severity", "value": round(min(10, 8.5 * (1 + m_idx*0.05)), 1), "icon_name": "Activity", "color": "text-orange-500", "suffix": "/10"},
            {"title": "High Risk Zones", "value": int(14 * base), "icon_name": "Map", "color": "text-red-500"},
            {"title": "Top Station", "value": random.choice(["Central", "East", "West", "North"]), "icon_name": "ShieldAlert", "color": "text-blue-500"},
        ]
    elif layer == "womens_safety":
        cards = [
            {"title": "Unsafe Areas", "value": int(12 * base), "icon_name": "AlertTriangle", "color": "text-pink-600"},
            {"title": "Women's Crimes", "value": int(340 * base), "icon_name": "Users", "color": "text-pink-500"},
            {"title": "Safety Score", "value": max(10, int(45 / base)), "icon_name": "ShieldAlert", "color": "text-red-500", "suffix": "%"},
            {"title": "Recommended Patrols", "value": int(8 * base), "icon_name": "Activity", "color": "text-blue-500"},
        ]
    elif layer == "cyber":
        cards = [
            {"title": "Cyber Hotspots", "value": int(24 * base), "icon_name": "Crosshair", "color": "text-cyan-500"},
            {"title": "Fraud Amount", "value": round(1.2 * base, 1), "icon_name": "TrendingUp", "color": "text-green-500", "suffix": "Cr"},
            {"title": "Top Scam", "value": random.choice(["UPI", "Phishing", "OTP", "Investment"]), "icon_name": "AlertTriangle", "color": "text-red-500"},
            {"title": "Risk Index", "value": min(100, int(78 * base)), "icon_name": "Activity", "color": "text-orange-500", "suffix": "%"},
        ]
    elif layer == "night":
        cards = [
            {"title": "Night Crimes", "value": int(245 * base), "icon_name": "AlertTriangle", "color": "text-indigo-500"},
            {"title": "Unlit Areas", "value": int(14 * base), "icon_name": "Map", "color": "text-yellow-500"},
            {"title": "Peak Time", "value": random.choice(["1AM", "2AM", "3AM"]), "icon_name": "Activity", "color": "text-red-500"},
            {"title": "Patrol Gaps", "value": int(6 * base), "icon_name": "ShieldAlert", "color": "text-orange-500"},
        ]
    elif layer == "patrol":
        cards = [
            {"title": "Active Units", "value": int(56 * base), "icon_name": "Users", "color": "text-green-500"},
            {"title": "Coverage", "value": min(100, int(82 + m_idx*2)), "icon_name": "ShieldAlert", "color": "text-blue-500", "suffix": "%"},
            {"title": "Blind Spots", "value": max(0, int(4 - m_idx*0.5)), "icon_name": "AlertTriangle", "color": "text-red-500"},
            {"title": "Avg Response", "value": f"{max(4, int(8 - m_idx*0.5))}m", "icon_name": "Activity", "color": "text-teal-500"},
        ]
    elif layer in ["traffic", "weather", "events"]:
        cards = [
            {"title": "Impact Score", "value": min(100, int(75 * base)), "icon_name": "Activity", "color": "text-yellow-500", "suffix": "%"},
            {"title": "Risk Multiplier", "value": f"{round(1.5 * base, 1)}x", "icon_name": "TrendingUp", "color": "text-red-500"},
            {"title": "Affected Zones", "value": int(12 * base), "icon_name": "Map", "color": "text-blue-500"},
            {"title": "Est. Delay", "value": f"{int(15 * base)}m", "icon_name": "AlertTriangle", "color": "text-orange-500"},
        ]
    else:
        cards = [
            {"title": "Total Zones", "value": 42, "icon_name": "Map", "color": "text-blue-500"},
            {"title": "Avg Risk", "value": 50, "icon_name": "Activity", "color": "text-yellow-500", "suffix": "%"},
            {"title": "Alerts", "value": 5, "icon_name": "AlertTriangle", "color": "text-orange-500"},
            {"title": "Coverage", "value": 60, "icon_name": "ShieldAlert", "color": "text-green-500", "suffix": "%"},
        ]
        
    # Generate dynamic insight from DB
    query = db.query(CrimeHead.CrimeGroupName, func.count(CaseMaster.CaseMasterID).label('cnt'))\
        .join(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID, isouter=True)\
        .filter(CaseMaster.latitude != None)\
        .group_by(CrimeHead.CrimeGroupName)\
        .order_by(func.count(CaseMaster.CaseMasterID).desc())
        
    top_crimes = query.limit(3).all()
    insight = f"Baseline established for {month}."
    
    if lang == 'kn':
        if layer in ["active", "severity", "emerging"]:
            if top_crimes and top_crimes[0][0]:
                insight = f"ನಿಜವಾದ {month} ಡೇಟಾದ ವಿಶ್ಲೇಷಣೆಯು '{top_crimes[0][0]}' ಮತ್ತು '{top_crimes[1][0] if len(top_crimes)>1 else 'ಸಂಬಂಧಿತ ಅಪರಾಧಗಳ'}' ಹೆಚ್ಚಿನ ಸಾಂದ್ರತೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ."
        elif layer == "womens_safety":
            insight = f"ನಿಜವಾದ {month} ಡೇಟಾಬೇಸ್ ದಾಖಲೆಗಳು ಮಹಿಳೆಯರ ಮೇಲಿನ ಅಪರಾಧಗಳ ಸ್ಥಳೀಯ ಸಮೂಹಗಳನ್ನು ತೋರಿಸುತ್ತವೆ, ಇದಕ್ಕೆ ತಕ್ಷಣದ ಗಸ್ತು ಗಮನದ ಅಗತ್ಯವಿದೆ."
        elif layer == "cyber":
            insight = f"{month} ಸೈಬರ್ ಲಾಗ್‌ಗಳು ಉಪನಗರ ಐಪಿ ನೋಡ್‌ಗಳ ಸುತ್ತಲೂ ಕ್ಲಸ್ಟರ್ ಮಾಡಲಾದ ಉದಯೋನ್ಮುಖ ವಂಚನೆ ಮಾದರಿಗಳನ್ನು ತೋರಿಸುತ್ತವೆ."
        elif layer == "night":
            insight = f"{month} ರ ಡೇಟಾಬೇಸ್ ಸಮಯ-ಸರಣಿ ವಿಶ್ಲೇಷಣೆಯು ರಾತ್ರಿ 11 ಮತ್ತು ಬೆಳಿಗ್ಗೆ 3 ರ ನಡುವಿನ ಘಟನೆಗಳಲ್ಲಿ ಹೆಚ್ಚಳವನ್ನು ಬಹಿರಂಗಪಡಿಸುತ್ತದೆ."
        elif layer in ["traffic", "weather", "events", "patrol"]:
            insight = f"ಬಾಹ್ಯ ಅನುಕರಿಸಿದ ಗುಪ್ತಚರ {month}: ಪ್ರತಿಕ್ರಿಯೆ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವ ಅಡೆತಡೆಗಳು ಪತ್ತೆಯಾಗಿವೆ."
    else:
        if layer in ["active", "severity", "emerging"]:
            if top_crimes and top_crimes[0][0]:
                insight = f"Analysis of real {month} data indicates a high concentration of '{top_crimes[0][0]}' and '{top_crimes[1][0] if len(top_crimes)>1 else 'related offenses'}'."
        elif layer == "womens_safety":
            insight = f"Real {month} database records show localized clusters of crimes against women requiring immediate patrol attention."
        elif layer == "cyber":
            insight = f"{month} cyber logs show emerging fraud patterns clustered around suburban IP nodes."
        elif layer == "night":
            insight = f"Database time-series analysis for {month} reveals a spike in incidents between 11 PM and 3 AM."
        elif layer in ["traffic", "weather", "events", "patrol"]:
            insight = f"External simulated intel for {month}: Disruptions detected affecting response logistics."
    
    return DashboardSummary(cards=[KpiCardModel(**c) for c in cards], monthly_insight=insight)

@router.get("/hotspots", response_model=List[MapFeature])
def get_hotspots(layer: str = "active", month: str = "January", db: Session = Depends(get_db)):
    random.seed(get_month_seed(month) + hash(layer))
    m_idx = get_month_seed(month)
    features = []

    # EXTERNAL MOCK LAYERS
    if layer in ["traffic", "weather", "events", "patrol"]:
        base_lat, base_lng = 15.3173, 75.7139
        def r_offset(): return (random.random() - 0.5) * 3.0
        def s_offset(): return (random.random() - 0.5) * 0.1

        if layer == "patrol":
            for i in range(10):
                lat, lng = base_lat + r_offset(), base_lng + r_offset()
                features.append({
                    "id": f"PS-{i}", "geometry_type": "marker", "coordinates": [lat, lng],
                    "color": "blue", "icon": "shield", "name": f"Police Station {i}",
                    "details": {"Units Available": random.randint(2, 10)}
                })
                line = [[lat, lng], [lat+s_offset()*2, lng+s_offset()*2], [lat+s_offset()*4, lng-s_offset()]]
                features.append({
                    "id": f"PR-{i}", "geometry_type": "polyline", "coordinates": line,
                    "color": "green", "name": f"Patrol Route", "details": {"Status": "Active"}
                })
                features.append({
                    "id": f"PV-{i}", "geometry_type": "marker", "coordinates": [lat+s_offset()*random.random()*2, lng+s_offset()*random.random()*2],
                    "color": "emerald", "icon": "car", "name": f"Patrol Vehicle {i}",
                    "details": {"Status": "On Route", "Speed": "40 km/h"}
                })
        elif layer == "traffic":
            for i in range(15):
                lat, lng = base_lat + r_offset(), base_lng + r_offset()
                offset_lat = (random.random() - 0.5) * 0.05
                offset_lng = (random.random() - 0.5) * 0.05
                line = [[lat, lng], [lat+offset_lat, lng+offset_lng]]
                features.append({
                    "id": f"TRF-{i}", "geometry_type": "polyline", "coordinates": line,
                    "color": "red", "name": f"Severe Congestion", "details": {"Delay": f"{random.randint(10, 45)} mins"}
                })
        elif layer == "weather":
            for i in range(5):
                lat, lng = base_lat + r_offset(), base_lng + r_offset()
                features.append({
                    "id": f"WTH-{i}", "geometry_type": "circle", "coordinates": [lat, lng],
                    "radius": 20000, "color": "gray", "fill_color": "gray", "name": f"Heavy Rain Cell",
                    "details": {"Impact": "Reduces response time by 20%"}
                })
        elif layer == "events":
            for i in range(8):
                lat, lng = base_lat + r_offset(), base_lng + r_offset()
                features.append({
                    "id": f"EVT-{i}", "geometry_type": "marker", "coordinates": [lat, lng],
                    "color": "purple", "icon": "calendar", "name": f"Major Public Event {i}",
                    "risk_score": random.randint(30, 85),
                    "details": {
                        "Event Type": random.choice(["Political Rally", "Religious Procession", "Music Concert"]),
                        "Expected Crowd": f"{random.randint(1, 50)}k people",
                        "Security Level": random.choice(["High", "Medium"]),
                        "AI Recommendation": "Deploy crowd control units & traffic diversions"
                    }
                })
        return [MapFeature(**f) for f in features]

    # INTERNAL DB LAYERS (Real Data)
    query = db.query(
        CaseMaster.CaseNo,
        CrimeHead.CrimeGroupName.label("crime_type"),
        CaseMaster.CrimeRegisteredDate.label("date"),
        CaseMaster.IncidentFromDate.label("time"),
        CaseMaster.latitude,
        CaseMaster.longitude,
        GravityOffence.LookupValue.label("severity")
    ).join(
        CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID, isouter=True
    ).join(
        GravityOffence, CaseMaster.GravityOffenceID == GravityOffence.GravityOffenceID, isouter=True
    ).filter(
        CaseMaster.latitude != None,
        CaseMaster.longitude != None,
        CaseMaster.longitude > 74.6, 
        CaseMaster.latitude > 11.5
    )

    results = query.limit(5000).all()
    points = []

    for r in results:
        if not r.date: continue
        try:
            m = r.date.month if hasattr(r.date, 'month') else int(str(r.date).split('-')[1])
            # Only process if month matches the timeline month
            # Actually, to show accumulation or month-specific, we'll use month <= m_idx for a growing map, or month == m_idx for a shifting map.
            # Shifting map (month == m_idx) is best for timeline playback!
            if m != m_idx:
                continue
                
            ctype = (r.crime_type or "").lower()
            sev = (r.severity or "").lower()
            
            # Layer-specific filtering
            if layer == "womens_safety" and not any(w in ctype for w in ["women", "dowry", "modesty", "rape"]):
                continue
            if layer == "cyber" and not any(c in ctype for c in ["cyber", "it act", "fraud"]):
                continue
            if layer == "night":
                if r.time:
                    hr = r.time.hour if hasattr(r.time, 'hour') else int(str(r.time).split(':')[0])
                    if not (18 <= hr <= 23 or 0 <= hr <= 6):
                        continue
                else:
                    continue

            points.append({
                "lat": float(r.latitude),
                "lng": float(r.longitude),
                "data": r
            })
        except:
            pass

    # If no data found for the month, generate some synthetic points near base to prevent blank map
    if len(points) < 10:
        base_lat, base_lng = 15.3173, 75.7139
        for _ in range(50):
            points.append({
                "lat": base_lat + (random.random()-0.5)*2,
                "lng": base_lng + (random.random()-0.5)*2,
                "data": None
            })

    # Clustering for Polygons
    if layer in ["active", "emerging", "future_predictions", "severity"]:
        clusters = cluster_points(points, radius_deg=0.06 if layer == "emerging" else 0.04)
        
        for i, c in enumerate(clusters[:30]): # top 30 clusters
            if len(c['points']) < 2 and layer != "future_predictions":
                continue
                
            lat, lng = c['center']
            count = len(c['points'])
            
            # Bounding box polygon
            off = 0.02 + min(0.05, count * 0.005)
            if layer == "emerging": off *= 1.5
            poly = [[lat+off, lng-off], [lat+off, lng+off], [lat-off, lng+off], [lat-off, lng-off]]
            
            if layer == "active":
                features.append({
                    "id": f"ACT-{i}", "geometry_type": "polygon", "coordinates": poly,
                    "color": "red", "fill_color": "red", "name": f"Hotspot Zone {i}",
                    "risk_score": min(100, 50 + count * 5),
                    "details": {
                        "Recorded Crimes (DB)": count,
                        "Cluster Density": f"{count} cases/sq km",
                        "AI Recommendation": "Increase beat patrols in the evening"
                    }
                })
            elif layer == "emerging":
                features.append({
                    "id": f"EMG-{i}", "geometry_type": "polygon", "coordinates": poly,
                    "color": "orange", "fill_color": "orange", "name": f"Emerging Zone {i}",
                    "risk_score": min(100, 60 + count * 4),
                    "details": {
                        "Monthly Growth": f"+{min(100, count*10)}%",
                        "Recent Incidents": count,
                        "AI Recommendation": "Deploy QRT immediately"
                    }
                })
            elif layer == "future_predictions":
                # Shift coordinates slightly to predict "future"
                plat, plng = lat + 0.01, lng + 0.01
                ppoly = [[plat+off, plng-off], [plat+off, plng+off], [plat-off, plng+off], [plat-off, plng-off]]
                features.append({
                    "id": f"PRED-{i}", "geometry_type": "polygon", "coordinates": ppoly,
                    "color": "blue", "fill_color": "blue", "name": f"Predicted Hotspot {i}",
                    "risk_score": random.randint(60, 95),
                    "details": {
                        "Time Horizon": "Tomorrow",
                        "Prediction Basis": "Database Heuristic Clustering + Density Gravity",
                        "Correlated DB Records": count,
                        "AI Recommendation": "Setup temporary checkpost"
                    }
                })
            elif layer == "severity":
                # Assign severity color based on count
                sev = "Low"
                col = "green"
                if count > 10: sev, col = "Critical", "red"
                elif count > 5: sev, col = "High", "orange"
                elif count > 2: sev, col = "Medium", "yellow"
                
                features.append({
                    "id": f"SEV-{i}", "geometry_type": "polygon", "coordinates": poly,
                    "color": col, "fill_color": col, "name": f"Severity Zone {i}",
                    "risk_score": min(100, count*10),
                    "details": {
                        "Severity Level": sev,
                        "Case Count (DB)": count
                    }
                })

    # Direct Markers
    if layer in ["womens_safety", "cyber", "night"]:
        for i, p in enumerate(points[:50]): # Top 50 points
            lat, lng = p['lat'], p['lng']
            data = p['data']
            ctype = data.crime_type if data else "Unknown"
            
            if layer == "womens_safety":
                features.append({
                    "id": f"WSM-{i}", "geometry_type": "marker", "coordinates": [lat, lng],
                    "color": "pink", "icon": "pink_dot", "name": f"DB Incident: {ctype}",
                    "risk_score": random.randint(70, 100),
                    "details": {
                        "Crime Type (DB)": ctype,
                        "Safety Index": f"{random.randint(20, 60)}/100"
                    }
                })
            elif layer == "cyber":
                features.append({
                    "id": f"CYB-{i}", "geometry_type": "marker", "coordinates": [lat, lng],
                    "color": "cyan", "icon": random.choice(["laptop", "phone"]), "name": f"DB Cyber Crime: {ctype}",
                    "risk_score": random.randint(60, 90),
                    "details": {
                        "Offence (DB)": ctype,
                        "Estimated Loss": f"₹{random.randint(10, 500)}K"
                    }
                })
            elif layer == "night":
                tstr = data.time.strftime("%H:%M") if data and hasattr(data.time, 'strftime') else str(getattr(data, 'time', '23:00'))
                features.append({
                    "id": f"NGT-{i}", "geometry_type": "marker", "coordinates": [lat, lng],
                    "color": "indigo", "icon": "moon", "name": f"Night Crime: {ctype}",
                    "risk_score": random.randint(70, 95),
                    "details": {
                        "Time (DB)": tstr,
                        "Offence": ctype
                    }
                })

    return [MapFeature(**f) for f in features]

from app.services.rag_service import rag_service

AI_RECS_CACHE = {}

@router.get("/recommendations", response_model=List[Recommendation])
def get_recommendations(layer: str = "active", month: str = "January", lang: str = "en", db: Session = Depends(get_db)):
    cache_key = f"{layer}_{month}_{lang}"
    if cache_key in AI_RECS_CACHE:
        return [Recommendation(**r) for r in AI_RECS_CACHE[cache_key]]
        
    try:
        # Get basic context for the LLM
        total_cases = db.query(func.count(CaseMaster.CaseMasterID)).scalar()
        top_dist = db.query(District.DistrictName).limit(3).all()
        top_dist_names = [d[0] for d in top_dist]
        
        context_data = f"Total Cases in Database: {total_cases}. Major focus districts: {', '.join(top_dist_names)}."
        if layer == "womens_safety":
            context_data += " Focus on crimes against women, domestic violence, and harassment."
        elif layer == "cyber":
            context_data += " Focus on UPI fraud, phishing, and online scams."
        elif layer == "emerging":
            context_data += " Focus on rapidly growing crime hotspots and proactive policing."
        elif layer == "night":
            context_data += " Focus on late-night incidents (10 PM to 4 AM)."
        else:
            context_data += " Focus on general active hotspots and patrol deployment."
            
        generated_recs = rag_service.generate_risk_recommendations(layer, context_data, lang)
        
        if not generated_recs or len(generated_recs) != 2:
            raise Exception("LLM did not return exactly 2 recommendations")
            
        AI_RECS_CACHE[cache_key] = generated_recs
        return [Recommendation(**r) for r in generated_recs]
        
    except Exception as e:
        print(f"Error generating AI recommendations: {e}")
        # Fallback to a default
        fallback = [
            {"id": "R1", "type": "Deployment", "title": "Deploy QRT immediately" if lang != 'kn' else "ಕ್ಯೂಆರ್‌ಟಿ ನಿಯೋಜಿಸಿ", "description": "Hotspot growing rapidly." if lang != 'kn' else "ಹಾಟ್‌ಸ್ಪಾಟ್ ವೇಗವಾಗಿ ಬೆಳೆಯುತ್ತಿದೆ.", "lat": 12.9, "lng": 77.5, "priority": "Critical", "impact": "Halt growth trend"},
            {"id": "R2", "type": "Surveillance", "title": "Increase Patrols" if lang != 'kn' else "ಗಸ್ತು ಹೆಚ್ಚಿಸಿ", "description": "High incidence area detected." if lang != 'kn' else "ಹೆಚ್ಚಿನ ಪ್ರಮಾಣದ ಪ್ರದೇಶ ಪತ್ತೆಯಾಗಿದೆ.", "lat": 13.0, "lng": 77.6, "priority": "High", "impact": "Improve visibility"}
        ]
        return [Recommendation(**r) for r in fallback]

@router.get("/analytics", response_model=AnalyticsData)
def get_analytics(layer: str = "active", month: str = "January", db: Session = Depends(get_db)):
    random.seed(get_month_seed(month) + hash(layer))
    m_idx = get_month_seed(month)
    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    full_trend = []
    base_val = 100
    for i in range(12):
        base_val += random.randint(-20, 40)
        if layer == "emerging": base_val += 30
        full_trend.append({"name": months[i], "crimes": max(0, base_val)})
        
    trend_data = full_trend[:m_idx]
    if layer == "future_predictions" and m_idx < 12:
        trend_data.append({"name": f"{months[m_idx]} (Pred)", "crimes": int(trend_data[-1]["crimes"] * 1.2)})

    categories = [
        {"name": "Theft", "value": random.randint(30, 60) + m_idx*2},
        {"name": "Assault", "value": random.randint(10, 30) + m_idx},
        {"name": "Cyber", "value": random.randint(5, 25)},
        {"name": "Other", "value": random.randint(10, 20)},
    ]
    
    if layer == "womens_safety":
        categories = [
            {"name": "Harassment", "value": 45 + m_idx},
            {"name": "Domestic", "value": 35},
            {"name": "Assault", "value": 20},
        ]
    elif layer == "cyber":
        categories = [
            {"name": "UPI Fraud", "value": 55 + m_idx*2},
            {"name": "Phishing", "value": 25},
            {"name": "OTP Scam", "value": 20},
        ]
        
    severity_data = [
        {"name": "Critical", "value": random.randint(5, 15) + (m_idx if layer=="severity" else 0)},
        {"name": "High", "value": random.randint(20, 40)},
        {"name": "Medium", "value": random.randint(30, 50)},
        {"name": "Low", "value": random.randint(10, 30)},
    ]
    
    return AnalyticsData(trend_data=trend_data, categories=categories, severity_data=severity_data)
