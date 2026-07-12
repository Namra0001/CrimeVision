import os
import sys
# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.cluster import DBSCAN
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

# Setup SQLAlchemy connection to query the DB directly
from app.db.session import SessionLocal
from app.models.case import CaseMaster

def train_model():
    print("Connecting to database...")
    db = SessionLocal()
    
    try:
        # Fetch all historical incidents with valid coordinates
        print("Fetching historical crime data...")
        incidents = db.query(
            CaseMaster.latitude,
            CaseMaster.longitude,
            CaseMaster.CrimeRegisteredDate,
            CaseMaster.IncidentFromDate
        ).filter(
            CaseMaster.latitude != None,
            CaseMaster.longitude != None,
            CaseMaster.longitude > 74.6, 
            CaseMaster.latitude > 11.5
        ).all()
        
        if len(incidents) < 10:
            print("Not enough data to train a reliable model. We need at least 10 incidents.")
            return

        print(f"Loaded {len(incidents)} records.")
        
        # Prepare Dataframe
        data = []
        for inc in incidents:
            lat = float(inc.latitude)
            lng = float(inc.longitude)
            # Basic parsing of date for features
            if inc.CrimeRegisteredDate:
                try:
                    month = inc.CrimeRegisteredDate.month if hasattr(inc.CrimeRegisteredDate, 'month') else int(str(inc.CrimeRegisteredDate).split('-')[1])
                except:
                    month = 1
            else:
                month = 1
            
            data.append([lat, lng, month])
            
        df = pd.DataFrame(data, columns=['lat', 'lng', 'month'])
        
        print("Clustering historical data to find crime hotspots...")
        # Use DBSCAN to identify high-density clusters (zones)
        coords = df[['lat', 'lng']].values
        
        # epsilon: ~4km (0.04 degrees)
        dbscan = DBSCAN(eps=0.04, min_samples=2).fit(coords)
        df['zone_id'] = dbscan.labels_
        
        # Filter out noise (zone -1)
        clustered_df = df[df['zone_id'] != -1].copy()
        print(f"Found {len(clustered_df['zone_id'].unique())} unique historical crime zones.")
        
        # Generate training dataset
        # Features: [lat, lng, month]
        # Target: 1 (Crime occurred)
        
        # To train a classifier, we need negative samples (areas/times with no crime)
        # We will generate synthetic negative samples
        print("Generating training dataset (positive and negative samples)...")
        
        positive_samples = clustered_df[['lat', 'lng', 'month']].copy()
        positive_samples['target'] = 1
        
        # Generate negative samples: random locations near the clusters, but different months
        num_neg = len(positive_samples) * 2
        
        if num_neg > 0:
            neg_lat = np.random.choice(positive_samples['lat'], num_neg) + np.random.normal(0, 0.05, num_neg)
            neg_lng = np.random.choice(positive_samples['lng'], num_neg) + np.random.normal(0, 0.05, num_neg)
            neg_month = np.random.randint(1, 13, num_neg)
            
            negative_samples = pd.DataFrame({
                'lat': neg_lat,
                'lng': neg_lng,
                'month': neg_month,
                'target': 0
            })
            
            train_df = pd.concat([positive_samples, negative_samples], ignore_index=True)
        else:
            train_df = positive_samples
            
        # Shuffle
        train_df = train_df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        X = train_df[['lat', 'lng', 'month']]
        y = train_df['target']
        
        print("Training Random Forest Classifier...")
        clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        clf.fit(X, y)
        
        accuracy = clf.score(X, y)
        print(f"Model trained with training accuracy: {accuracy * 100:.2f}%")
        
        # Save model and cluster centers so the API can use them
        centers = []
        for zone in clustered_df['zone_id'].unique():
            zone_data = clustered_df[clustered_df['zone_id'] == zone]
            center_lat = zone_data['lat'].mean()
            center_lng = zone_data['lng'].mean()
            historical_count = len(zone_data)
            centers.append({
                'lat': center_lat,
                'lng': center_lng,
                'count': historical_count
            })
            
        model_data = {
            'classifier': clf,
            'zones': centers
        }
        
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'crime_model.pkl')
        print(f"Saving model to {model_path}...")
        joblib.dump(model_data, model_path)
        print("Training complete!")

    except Exception as e:
        print(f"Error during training: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    train_model()
