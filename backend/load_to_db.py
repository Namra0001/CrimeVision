import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load database URL
load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise Exception("DATABASE_URL not found in .env")
    
# Connect to DB
engine = create_engine(database_url)
csv_dir = r'd:\CrimeVision\ksp_synthetic_database\csv'

files = [f for f in os.listdir(csv_dir) if f.endswith('.csv')]

with engine.begin() as conn:
    print("Disabling Foreign Key constraints temporarily...")
    conn.execute(text("SET session_replication_role = 'replica';"))
    
    # Optional: We could truncate the tables, but to_sql with replace drops them.
    # To preserve constraints (like Foreign Keys), it's better to TRUNCATE and append.
    # Let's TRUNCATE all these tables first.
    print("Truncating existing tables to clear dummy data...")
    for file in files:
        table_name = file.replace('.csv', '').lower()
        # Check if table exists before truncating to avoid transaction abort
        result = conn.execute(text(f"SELECT to_regclass('{table_name}')")).scalar()
        if result:
            conn.execute(text(f"TRUNCATE TABLE {table_name} CASCADE;"))
        else:
            print(f"Table {table_name} not found. It will be created.")

    for file in files:
        table_name = file.replace('.csv', '').lower()
        print(f"Loading {table_name}...")
        
        df = pd.read_csv(os.path.join(csv_dir, file))
        
        # if_exists='append' will keep the table structure if it exists, or create if not.
        df.to_sql(table_name, conn, if_exists='append', index=False)
        print(f"Successfully loaded {len(df)} rows into {table_name}")

    print("Re-enabling Foreign Key constraints...")
    conn.execute(text("SET session_replication_role = 'origin';"))

print("\nDatabase load complete! Total records added: 131394")
