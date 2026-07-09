import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(r'd:\CrimeVision\backend\.env')
engine = create_engine(os.getenv('DATABASE_URL'))

with engine.begin() as conn:
    conn.execute(text("""
        CREATE OR REPLACE VIEW dashboard_category_stats AS
        SELECT ch."CrimeGroupName" as name, count(cm."CaseMasterID") as value
        FROM crimehead ch
        JOIN casemaster cm ON cm."CrimeMajorHeadID" = ch."CrimeHeadID"
        GROUP BY ch."CrimeGroupName"
        ORDER BY value DESC
        LIMIT 5;
    """))
print('View created successfully')
