import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise Exception("DATABASE_URL not found in .env")

engine = create_engine(database_url)

with engine.begin() as conn:
    print("Enabling PostGIS extension...")
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
    
    print("Adding geometry column to casemaster if it doesn't exist...")
    try:
        conn.execute(text("ALTER TABLE casemaster ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);"))
    except Exception as e:
        print(f"Column might already exist: {e}")
        
    print("Populating geom column from latitude and longitude...")
    conn.execute(text("""
        UPDATE casemaster 
        SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) 
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND geom IS NULL;
    """))
    
    print("Creating spatial index...")
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_casemaster_geom ON casemaster USING GIST (geom);"))

print("Migration completed successfully!")
