import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

def main():
    load_dotenv()
    database_url = os.getenv("DATABASE_URL", "sqlite:///./crimevision.db")
    
    # Ensure it's sqlite
    if not database_url.startswith("sqlite"):
        print("This script is optimized for SQLite. Exiting.")
        return

    engine = create_engine(database_url)
    csv_dir = r'd:\CrimeVision\ksp_synthetic_database\csv'

    if not os.path.exists(csv_dir):
        print(f"Directory {csv_dir} does not exist.")
        return

    files = [f for f in os.listdir(csv_dir) if f.endswith('.csv')]
    
    # We will just append the data or replace. 
    # Since it's a fresh DB, append is fine.
    # We will use pandas to load all CSVs into the SQLite DB.
    
    # We need to map the file names to actual table names in SQLite.
    # The models in the database use specific table names (e.g. casemaster vs case_master).
    # From dashboard_api.py, we saw it queries CaseMaster. CaseMaster is probably table 'casemaster'.
    # Let's just use the file name as table name, but lowercase.
    
    total_rows = 0
    with engine.connect() as conn:
        for file in files:
            table_name = file.replace('.csv', '').lower()
            print(f"Loading {table_name}...")
            df = pd.read_csv(os.path.join(csv_dir, file))
            
            # Write to sqlite
            df.to_sql(table_name, conn, if_exists='replace', index=False)
            total_rows += len(df)
            print(f"Successfully loaded {len(df)} rows into {table_name}")

    print(f"\nDatabase load complete! Total records added: {total_rows}")

if __name__ == '__main__':
    main()
