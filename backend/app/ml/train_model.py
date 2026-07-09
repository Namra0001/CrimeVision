import os
import sys
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.db.session import SessionLocal
from app.models.case import CaseMaster, CrimeHead
from app.models.entities import Unit
from app.models.lookups import District
from sqlalchemy import func

def train_and_save_model():
    print("Connecting to database and extracting historical data...")
    db = SessionLocal()
    
    try:
        # Extract case counts grouped by District, CrimeGroup, Year, Month
        results = db.query(
            District.DistrictID,
            CrimeHead.CrimeHeadID,
            func.extract('year', CaseMaster.CrimeRegisteredDate).label('year'),
            func.extract('month', CaseMaster.CrimeRegisteredDate).label('month'),
            func.count(CaseMaster.CaseMasterID).label('case_count')
        ).join(Unit, CaseMaster.PoliceStationID == Unit.UnitID)\
         .join(District, Unit.DistrictID == District.DistrictID)\
         .join(CrimeHead, CaseMaster.CrimeMajorHeadID == CrimeHead.CrimeHeadID)\
         .filter(CaseMaster.CrimeRegisteredDate != None)\
         .group_by(District.DistrictID, CrimeHead.CrimeHeadID, 'year', 'month')\
         .all()
         
        if not results:
            print("No data found to train the model. Generating synthetic baseline for training.")
            # Fallback to synthetic if database is empty/mocked in a way this query fails
            df = pd.DataFrame([{
                'district_id': 1, 'crime_head_id': 1, 'month': m, 'case_count': 50 + (m*2)
            } for m in range(1, 13)])
        else:
            df = pd.DataFrame([{
                'district_id': r[0],
                'crime_head_id': r[1],
                'year': int(r[2]),
                'month': int(r[3]),
                'case_count': r[4]
            } for r in results])
            
        print(f"Extracted {len(df)} monthly aggregate records.")
        
        # Feature Engineering
        # Predict next month's case count based on district, crime type, and current month
        # Target: case_count
        X = df[['district_id', 'crime_head_id', 'month']]
        y = df['case_count']
        
        print("Training Random Forest Regressor...")
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Save the model
        model_path = os.path.join(os.path.dirname(__file__), 'crime_forecaster.joblib')
        joblib.dump(model, model_path)
        print(f"Model successfully trained and saved to {model_path}")
        
    finally:
        db.close()

if __name__ == "__main__":
    train_and_save_model()
