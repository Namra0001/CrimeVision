import os
import random
import json
import zipfile
import urllib.request
import urllib.parse
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
import math

fake = Faker('en_IN')

# Define Constants
NUM_CASES = 1000
NUM_VICTIMS = 1200
NUM_ACCUSED = 1500
NUM_COMPLAINANTS = 1000
NUM_EMPLOYEES = 50
NUM_COURTS = 10
NUM_SECTIONS = 500
NUM_CHARGESHEETS = 600
NUM_ARRESTS = 700
NUM_VEHICLES = 800
NUM_PROPERTIES = 600
NUM_WITNESSES = 1200

# Base Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ksp_synthetic_database'))
CSV_DIR = os.path.join(BASE_DIR, 'csv')
SQL_DIR = os.path.join(BASE_DIR, 'sql')
EXCEL_DIR = os.path.join(BASE_DIR, 'excel')
JSON_DIR = os.path.join(BASE_DIR, 'json')

# Create Directories
for d in [CSV_DIR, SQL_DIR, EXCEL_DIR, JSON_DIR]:
    os.makedirs(d, exist_ok=True)

KARNATAKA_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", 
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", 
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", 
    "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", 
    "Udupi", "Uttara Kannada", "Vijayapura", "Vijayanagara", "Yadgir"
]

KARNATAKA_CITIES = [
    "Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Belagavi", "Ballari", 
    "Kalaburagi", "Vijayapura", "Mangaluru", "Shivamogga", "Tumakuru", 
    "Raichur", "Bidar", "Hassan", "Udupi", "Chikkamagaluru", "Kolar", 
    "Mandya", "Chitradurga", "Hosapete", "Gadag", "Bagalkot", "Karwar", 
    "Sirsi", "Bhadravati", "Davanagere", "Ramanagara", "Koppal", "Yadgir", 
    "Haveri", "Madikeri", "Chamarajanagar"
]

KARNATAKA_TALUKS = [
    "Bantwal", "Puttur", "Sullia", "Moodabidri", "Karkala", "Kundapura", 
    "Udupi", "Brahmavar", "Tirthahalli", "Sagara", "Shikaripura", "Bhadravati", 
    "Soraba", "Hosanagara", "Mysuru", "Nanjangud", "Hunsur", "KR Nagar", 
    "Periyapatna", "Mandya", "Maddur", "Malavalli", "Nagamangala", "Pandavapura", 
    "Belagavi", "Athani", "Bailhongal", "Chikkodi", "Gokak", "Ramdurg", 
    "Saundatti", "Raibag", "Hukkeri", "Bengaluru North", "Bengaluru South", 
    "Anekal", "Yelahanka", "Devanahalli", "Doddaballapura", "Nelamangala", 
    "Hosakote", "Tumakuru", "Madhugiri", "Tiptur", "Gubbi", "Koratagere", 
    "Kunigal", "Sira", "Pavagada"
]

KARNATAKA_VILLAGES = [
    "Kumbalagodu", "Bidadi", "Harohalli", "Kengeri", "Yelwala", "Srirangapatna", 
    "Belur", "Halebidu", "Mudbidri", "Kudupu", "Somwarpet", "Virajpet", 
    "Kushalnagar", "Hanur", "Kollegal", "Yelandur", "Ankola", "Mundgod", 
    "Haliyal", "Honnavar", "Kumta", "Murudeshwar", "Basavakalyan", "Sedam", 
    "Shahabad", "Afzalpur", "Lingasugur", "Manvi", "Sindhanur", "Gangavathi", 
    "Kushtagi", "Mudhol", "Jamkhandi", "Ilkal", "Hungund"
]

POLICE_STATIONS_DATA = [
    {"name": "Cubbon Park Police Station", "lat": 12.9779, "lng": 77.5952, "district": "Bengaluru Urban"},
    {"name": "Ashok Nagar Police Station", "lat": 12.9723, "lng": 77.6083, "district": "Bengaluru Urban"},
    {"name": "Madiwala Police Station", "lat": 12.9226, "lng": 77.6174, "district": "Bengaluru Urban"},
    {"name": "Whitefield Police Station", "lat": 12.9698, "lng": 77.7499, "district": "Bengaluru Urban"},
    {"name": "Electronic City Police Station", "lat": 12.8452, "lng": 77.6601, "district": "Bengaluru Urban"},
    {"name": "Hebbal Police Station", "lat": 13.0354, "lng": 77.5971, "district": "Bengaluru Urban"},
    {"name": "Jayanagar Police Station", "lat": 12.9298, "lng": 77.5824, "district": "Bengaluru Urban"},
    {"name": "Yeshwanthpur Police Station", "lat": 13.0280, "lng": 77.5397, "district": "Bengaluru Urban"},
    {"name": "Banashankari Police Station", "lat": 12.9255, "lng": 77.5468, "district": "Bengaluru Urban"},
    {"name": "Basavanagudi Police Station", "lat": 12.9406, "lng": 77.5738, "district": "Bengaluru Urban"},
    {"name": "Vidhana Soudha Police Station", "lat": 12.9796, "lng": 77.5906, "district": "Bengaluru Urban"},
    {"name": "Mysuru South Police Station", "lat": 12.2858, "lng": 76.6508, "district": "Mysuru"},
    {"name": "Mysuru North Police Station", "lat": 12.3168, "lng": 76.6534, "district": "Mysuru"},
    {"name": "Belagavi Rural Police Station", "lat": 15.8281, "lng": 74.5204, "district": "Belagavi"},
    {"name": "Belagavi Market Police Station", "lat": 15.8573, "lng": 74.5050, "district": "Belagavi"},
    {"name": "Hubballi Town Police Station", "lat": 15.3647, "lng": 75.1239, "district": "Dharwad"},
    {"name": "Dharwad Sub Urban Police Station", "lat": 15.4589, "lng": 75.0078, "district": "Dharwad"},
    {"name": "Mangaluru North Police Station", "lat": 12.8711, "lng": 74.8430, "district": "Dakshina Kannada"},
    {"name": "Mangaluru South Police Station", "lat": 12.8624, "lng": 74.8427, "district": "Dakshina Kannada"},
    {"name": "Udupi Town Police Station", "lat": 13.3408, "lng": 74.7421, "district": "Udupi"},
    {"name": "Tumakuru Town Police Station", "lat": 13.3379, "lng": 77.1173, "district": "Tumakuru"},
    {"name": "Shivamogga Town Police Station", "lat": 13.9299, "lng": 75.5681, "district": "Shivamogga"},
    {"name": "Raichur East Police Station", "lat": 16.2081, "lng": 77.3458, "district": "Raichur"},
    {"name": "Ballari Rural Police Station", "lat": 15.1394, "lng": 76.9214, "district": "Ballari"},
    {"name": "Bidar Town Police Station", "lat": 17.9104, "lng": 77.5199, "district": "Bidar"},
    {"name": "Kalaburagi University Police Station", "lat": 17.3297, "lng": 76.8343, "district": "Kalaburagi"},
    {"name": "Mandya Rural Police Station", "lat": 12.5200, "lng": 76.8950, "district": "Mandya"}
]

db = {}

def generate_masters():
    print("Generating Master Tables...")
    db['State'] = pd.DataFrame([{'StateID': 1, 'StateName': 'Karnataka', 'NationalityID': 1, 'Active': True}])
    
    db['District'] = pd.DataFrame([
        {'DistrictID': i+1, 'DistrictName': d, 'StateID': 1, 'Active': True} 
        for i, d in enumerate(KARNATAKA_DISTRICTS)
    ])
    
    units = []
    for i, ps in enumerate(POLICE_STATIONS_DATA):
        dist_id = KARNATAKA_DISTRICTS.index(ps['district']) + 1
        units.append({
            'UnitID': i+1,
            'UnitName': ps['name'],
            'TypeID': 1,
            'ParentUnit': None,
            'NationalityID': 1,
            'StateID': 1,
            'DistrictID': dist_id,
            'Active': True,
            'lat': ps['lat'],
            'lng': ps['lng']
        })
    db['Unit'] = pd.DataFrame(units)

    courts = []
    for i in range(NUM_COURTS):
        dist_id = random.randint(1, len(KARNATAKA_DISTRICTS))
        courts.append({
            'CourtID': i+1,
            'CourtName': f"District and Sessions Court, {KARNATAKA_DISTRICTS[dist_id-1]}",
            'DistrictID': dist_id,
            'StateID': 1,
            'Active': True
        })
    db['Court'] = pd.DataFrame(courts)

    ranks = ["Constable", "Head Constable", "ASI", "SI", "Inspector", "ACP", "DCP", "SP", "Crime Analyst", "Commissioner"]
    db['Rank'] = pd.DataFrame([{'RankID': i+1, 'RankName': r, 'Hierarchy': i+1, 'Active': True} for i, r in enumerate(ranks)])
    db['Designation'] = pd.DataFrame([{'DesignationID': i+1, 'DesignationName': r, 'Active': True, 'SortOrder': i+1} for i, r in enumerate(ranks)])

    castes = ["General", "OBC", "SC", "ST", "Others"]
    db['CasteMaster'] = pd.DataFrame([{'caste_master_id': i+1, 'caste_master_name': c} for i, c in enumerate(castes)])
    
    religions = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Others"]
    db['ReligionMaster'] = pd.DataFrame([{'ReligionID': i+1, 'ReligionName': r} for i, r in enumerate(religions)])
    
    occupations = ["Student", "Business", "Government Service", "Private Job", "Agriculture", "Laborer", "Unemployed", "Homemaker"]
    db['OccupationMaster'] = pd.DataFrame([{'OccupationID': i+1, 'OccupationName': o} for i, o in enumerate(occupations)])
    
    educations = ["Illiterate", "Primary", "High School", "Graduate", "Post Graduate"]
    db['EducationMaster'] = pd.DataFrame([{'EducationID': i+1, 'EducationName': e} for i, e in enumerate(educations)])
    
    statuses = ["Under Investigation", "Chargesheeted", "Closed", "Pending Trial", "Convicted", "Acquitted"]
    db['CaseStatusMaster'] = pd.DataFrame([{'CaseStatusID': i+1, 'CaseStatusName': s} for i, s in enumerate(statuses)])
    
    categories = ["Heinous", "Non-Heinous", "Special and Local Laws (SLL)"]
    db['CaseCategory'] = pd.DataFrame([{'CaseCategoryID': i+1, 'LookupValue': c} for i, c in enumerate(categories)])
    
    gravities = ["High", "Medium", "Low"]
    db['GravityOffence'] = pd.DataFrame([{'GravityOffenceID': i+1, 'LookupValue': g} for i, g in enumerate(gravities)])

    crime_types = ["Murder", "Robbery", "Cyber Fraud", "Vehicle Theft", "Chain Snatching", "Kidnapping", "Domestic Violence", "Burglary", "Drug Case", "Economic Offence", "Rioting", "Assault", "Missing Person", "Women Harassment", "Child Crime"]
    db['CrimeHead'] = pd.DataFrame([{'CrimeHeadID': i+1, 'CrimeGroupName': c, 'Active': 1} for i, c in enumerate(crime_types)])
    
    subheads = []
    sh_id = 1
    for h_id, h_name in enumerate(crime_types):
        for _ in range(5):
            subheads.append({'CrimeSubHeadID': sh_id, 'CrimeHeadID': h_id+1, 'CrimeHeadName': f"{h_name} SubType {sh_id}", 'SeqID': sh_id})
            sh_id += 1
    db['CrimeSubHead'] = pd.DataFrame(subheads)

    acts = ["Indian Penal Code (IPC)", "Information Technology Act", "NDPS Act", "POCSO Act", "Arms Act"]
    db['Act'] = pd.DataFrame([{'ActCode': f"ACT{i+1}", 'ActDescription': a, 'ShortName': a[:5], 'Active': 1} for i, a in enumerate(acts)])
    
    sections = []
    for i in range(NUM_SECTIONS):
        act = random.choice(acts)
        sections.append({'SectionCode': f"SEC{i+1}", 'ActCode': f"ACT{acts.index(act)+1}", 'SectionDescription': f"Section {random.randint(100, 500)} of {act}", 'Active': 1})
    db['Section'] = pd.DataFrame(sections)

def generate_employees():
    print("Generating Employees...")
    emps = []
    for i in range(NUM_EMPLOYEES):
        emps.append({
            'EmployeeID': i+1,
            'DistrictID': random.randint(1, len(KARNATAKA_DISTRICTS)),
            'UnitID': random.randint(1, len(POLICE_STATIONS_DATA)),
            'RankID': random.randint(1, 10),
            'DesignationID': random.randint(1, 10),
            'KGID': f"KA{random.randint(100000, 999999)}",
            'FirstName': fake.name(),
            'EmployeeDOB': fake.date_of_birth(minimum_age=25, maximum_age=60),
            'GenderID': random.choice([1, 2]),
            'BloodGroupID': random.randint(1, 8),
            'PhysicallyChallenged': False,
            'AppointmentDate': fake.date_between(start_date='-20y', end_date='-1y')
        })
    db['Employee'] = pd.DataFrame(emps)

def fetch_osm_roads(lat, lng, radius=500):
    cache_key = f"{lat}_{lng}_{radius}"
    if cache_key in fetch_osm_roads.cache:
        return fetch_osm_roads.cache[cache_key]
        
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json];
    way(around:{radius},{lat},{lng})[highway];
    node(w);
    out skel;
    """
    
    try:
        req = urllib.request.Request(
            overpass_url, 
            data=overpass_query.encode('utf-8'),
            headers={'User-Agent': 'CrimeVisionApp/1.0 (research@example.com)'}
        )
        response = urllib.request.urlopen(req, timeout=10)
        data = json.loads(response.read().decode('utf-8'))
        nodes = [(el['lat'], el['lon']) for el in data.get('elements', []) if 'lat' in el and 'lon' in el]
        if nodes:
            fetch_osm_roads.cache[cache_key] = nodes
            return nodes
    except Exception as e:
        print(f"OSM fetch failed for {lat}, {lng}: {e}")
        pass
        
    return []
fetch_osm_roads.cache = {}

def generate_cases_and_entities():
    print(f"Generating {NUM_CASES} Cases with OSM Road Snapping...")
    cases = []
    assoc = []
    
    # Pre-fetch road nodes for all police stations to avoid blocking mid-loop
    print("Pre-fetching OSM road geometry for 27 Police Stations...")
    ps_road_nodes = {}
    for i, ps in enumerate(POLICE_STATIONS_DATA):
        nodes = fetch_osm_roads(ps['lat'], ps['lng'], 500)
        ps_road_nodes[i] = nodes
    
    for i in range(NUM_CASES):
        ps_idx = random.randint(0, len(POLICE_STATIONS_DATA)-1)
        ps_data = POLICE_STATIONS_DATA[ps_idx]
        ps_id = ps_idx + 1
        
        nodes = ps_road_nodes.get(ps_idx, [])
        if nodes:
            # Snap to a random valid road node within 500m
            lat, lon = random.choice(nodes)
        else:
            # Fallback to micro-offset if OSM fails or has no roads (very rare)
            lat_offset = random.choice([-1, 1]) * random.uniform(0.0009, 0.0045)
            lon_offset = random.choice([-1, 1]) * random.uniform(0.0009, 0.0045)
            lat = ps_data['lat'] + lat_offset
            lon = ps_data['lng'] + lon_offset
            
        # Validation
        if not (11.5 <= lat <= 18.5 and 74.0 <= lon <= 78.5):
            lat = ps_data['lat']
            lon = ps_data['lng']
            
        crime_date = fake.date_time_between(start_date='-3y', end_date='now')
        reg_date = crime_date + timedelta(hours=random.randint(1, 48))
        
        case_id = i+1
        cases.append({
            'CaseMasterID': case_id,
            'CrimeNo': f"CR/{fake.year()}/{random.randint(1000,9999)}",
            'CaseNo': f"CS/{fake.year()}/{random.randint(1000,9999)}",
            'CrimeRegisteredDate': reg_date.date(),
            'PolicePersonID': random.randint(1, NUM_EMPLOYEES),
            'PoliceStationID': ps_id,
            'CaseCategoryID': random.randint(1, 3),
            'GravityOffenceID': random.randint(1, 3),
            'CrimeMajorHeadID': random.randint(1, 15),
            'CrimeMinorHeadID': random.randint(1, 75),
            'CaseStatusID': random.randint(1, 6),
            'CourtID': random.randint(1, NUM_COURTS),
            'IncidentFromDate': crime_date,
            'IncidentToDate': crime_date + timedelta(hours=random.randint(1, 5)),
            'InfoReceivedPSDate': reg_date,
            'latitude': lat,
            'longitude': lon,
            'BriefFacts': fake.text(max_nb_chars=200),
            'Village': random.choice(KARNATAKA_VILLAGES),
            'Taluk': random.choice(KARNATAKA_TALUKS)
        })
        
        for j in range(random.randint(1, 3)):
            assoc.append({
                'CaseMasterID': case_id,
                'ActID': f"ACT{random.randint(1, 5)}",
                'SectionID': f"SEC{random.randint(1, NUM_SECTIONS)}",
                'ActOrderID': j+1,
                'SectionOrderID': j+1
            })
            
    db['CaseMaster'] = pd.DataFrame(cases)
    db['ActSectionAssociation'] = pd.DataFrame(assoc)

def generate_people():
    print(f"Generating {NUM_COMPLAINANTS} Complainants, {NUM_VICTIMS} Victims, {NUM_ACCUSED} Accused...")
    
    comps = []
    for i in range(NUM_COMPLAINANTS):
        comps.append({
            'ComplainantID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'ComplainantName': fake.name(),
            'AgeYear': random.randint(18, 80),
            'OccupationID': random.randint(1, 8),
            'ReligionID': random.randint(1, 7),
            'CasteID': random.randint(1, 5),
            'GenderID': random.choice([1, 2])
        })
    db['ComplainantDetails'] = pd.DataFrame(comps)
    
    victims = []
    for i in range(NUM_VICTIMS):
        victims.append({
            'VictimMasterID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'VictimName': fake.name(),
            'AgeYear': random.randint(5, 90),
            'GenderID': random.choice([1, 2]),
            'VictimPolice': random.choice(['0', '1'])
        })
    db['Victim'] = pd.DataFrame(victims)
    
    accused = []
    gangs = [f"GANG-{random.randint(100,999)}" for _ in range(50)]
    for i in range(NUM_ACCUSED):
        repeat = random.random() < 0.2
        accused.append({
            'AccusedMasterID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'AccusedName': fake.name(),
            'AgeYear': random.randint(18, 70),
            'GenderID': random.choice([1, 2]),
            'PersonID': f"A{random.randint(1,5)}",
            'RepeatOffender': repeat,
            'GangID': random.choice(gangs) if repeat else None,
            'Phone': fake.phone_number()
        })
    db['Accused'] = pd.DataFrame(accused)

def generate_assets():
    print("Generating Arrests, Vehicles, Properties, Chargesheets...")
    
    arrests = []
    for i in range(NUM_ARRESTS):
        arrests.append({
            'ArrestSurrenderID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'ArrestSurrenderTypeID': random.randint(1, 3),
            'ArrestSurrenderDate': fake.date_between(start_date='-2y', end_date='today'),
            'ArrestSurrenderStateId': 1,
            'ArrestSurrenderDistrictId': random.randint(1, len(KARNATAKA_DISTRICTS)),
            'PoliceStationID': random.randint(1, len(POLICE_STATIONS_DATA)),
            'IOID': random.randint(1, NUM_EMPLOYEES),
            'CourtID': random.randint(1, NUM_COURTS),
            'AccusedMasterID': random.randint(1, NUM_ACCUSED),
            'IsAccused': True,
            'IsComplainantAccused': False
        })
    db['ArrestSurrender'] = pd.DataFrame(arrests)
    
    vehicles = []
    types = ["Bike", "Car", "Auto", "Bus", "Truck"]
    for i in range(NUM_VEHICLES):
        vehicles.append({
            'VehicleID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'VehicleType': random.choice(types),
            'VehicleNumber': f"KA{random.randint(1, 60):02d}{random.choice(['A','B','C','D','E'])}{random.choice(['A','B','C','D','E'])}{random.randint(1000, 9999)}",
            'Owner': fake.name()
        })
    db['VehicleDetails'] = pd.DataFrame(vehicles)
    
    props = []
    ptypes = ["Jewellery", "Cash", "Mobile", "Laptop", "Documents", "Vehicles"]
    for i in range(NUM_PROPERTIES):
        props.append({
            'PropertyID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'PropertyType': random.choice(ptypes),
            'EstimatedValue': random.randint(1000, 500000)
        })
    db['PropertyDetails'] = pd.DataFrame(props)
    
    witnesses = []
    for i in range(NUM_WITNESSES):
        witnesses.append({
            'WitnessID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'WitnessName': fake.name(),
            'Phone': fake.phone_number()
        })
    db['WitnessDetails'] = pd.DataFrame(witnesses)
    
    sheets = []
    for i in range(NUM_CHARGESHEETS):
        sheets.append({
            'ChargesheetID': i+1,
            'CaseMasterID': random.randint(1, NUM_CASES),
            'Status': random.choice(["Filed", "Pending", "Rejected"]),
            'CourtID': random.randint(1, NUM_COURTS),
            'Judge': f"Hon. {fake.last_name()}",
            'FilingDate': fake.date_between(start_date='-2y', end_date='today')
        })
    db['ChargesheetDetails'] = pd.DataFrame(sheets)
    
    db['BailDetails'] = pd.DataFrame([
        {'BailID': i+1, 'AccusedMasterID': random.randint(1, NUM_ACCUSED), 'BailStatus': random.choice(['Granted', 'Rejected'])}
        for i in range(400)
    ])
    
    db['ChargeSheetAccused'] = pd.DataFrame([
        {'CSAccusedID': i+1, 'ChargesheetID': random.randint(1, NUM_CHARGESHEETS), 'AccusedMasterID': random.randint(1, NUM_ACCUSED)}
        for i in range(500)
    ])
    
    db['CaseHistory'] = pd.DataFrame([
        {'HistoryID': i+1, 'CaseMasterID': random.randint(1, NUM_CASES), 'UpdateDate': fake.date_between(start_date='-2y', end_date='today'), 'Remarks': 'Status updated'}
        for i in range(1500)
    ])

def export_data():
    print("Exporting data to CSV...")
    # Drop lat/lng from Unit before saving to not break original schema if it wasn't there
    unit_df = db['Unit'].copy()
    if 'lat' in unit_df.columns:
        unit_df = unit_df.drop(columns=['lat', 'lng'])
        
    for table_name, df in db.items():
        if table_name == 'Unit':
            unit_df.to_csv(os.path.join(CSV_DIR, f"{table_name}.csv"), index=False)
        else:
            df.to_csv(os.path.join(CSV_DIR, f"{table_name}.csv"), index=False)
        
    print("Exporting data to Excel...")
    with pd.ExcelWriter(os.path.join(EXCEL_DIR, 'KSP_Database.xlsx'), engine='openpyxl') as writer:
        for table_name, df in db.items():
            if table_name == 'Unit':
                unit_df.head(1000).to_excel(writer, sheet_name=table_name[:31], index=False)
            else:
                df.head(1000).to_excel(writer, sheet_name=table_name[:31], index=False)
            
    print("Exporting to JSON...")
    for table_name, df in db.items():
        if table_name == 'Unit':
            unit_df.to_json(os.path.join(JSON_DIR, f"{table_name}.json"), orient='records', date_format='iso')
        else:
            df.to_json(os.path.join(JSON_DIR, f"{table_name}.json"), orient='records', date_format='iso')

def generate_sql():
    print("Generating SQL...")
    
    schema_lines = []
    insert_lines = []
    
    unit_df = db['Unit'].copy()
    if 'lat' in unit_df.columns:
        unit_df = unit_df.drop(columns=['lat', 'lng'])
    db_export = db.copy()
    db_export['Unit'] = unit_df
    
    for table_name, df in db_export.items():
        cols = []
        for col, dtype in df.dtypes.items():
            if pd.api.types.is_integer_dtype(dtype):
                ctype = "INTEGER"
            elif pd.api.types.is_float_dtype(dtype):
                ctype = "FLOAT"
            elif pd.api.types.is_bool_dtype(dtype):
                ctype = "BOOLEAN"
            else:
                ctype = "VARCHAR(255)"
            cols.append(f"    {col} {ctype}")
        
        schema_lines.append(f"CREATE TABLE {table_name} (\n" + ",\n".join(cols) + "\n);")
        
        for idx, row in df.iterrows():
            vals = []
            for val in row:
                if pd.isna(val):
                    vals.append('NULL')
                elif isinstance(val, (int, float, bool)):
                    vals.append(str(val))
                else:
                    safe_val = str(val).replace("'", "''")
                    vals.append(f"'{safe_val}'")
            insert_lines.append(f"INSERT INTO {table_name} VALUES ({','.join(vals)});")
            
    with open(os.path.join(SQL_DIR, 'schema.sql'), 'w', encoding='utf-8') as f:
        f.write("\n\n".join(schema_lines))
        
    with open(os.path.join(SQL_DIR, 'insert_data.sql'), 'w', encoding='utf-8') as f:
        f.write("\n".join(insert_lines))

def zip_project():
    print("Zipping project...")
    zip_path = os.path.join(BASE_DIR, '..', 'KSP_Synthetic_Database.zip')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(BASE_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, os.path.join(BASE_DIR, '..')))
    print(f"Project zipped successfully to {zip_path}")

if __name__ == '__main__':
    generate_masters()
    generate_employees()
    generate_cases_and_entities()
    generate_people()
    generate_assets()
    export_data()
    generate_sql()
    zip_project()
    print("Done! KSP Synthetic Database generated completely.")
