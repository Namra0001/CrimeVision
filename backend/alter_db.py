import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
with engine.connect() as conn:
    conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE;'))
    conn.execute(text('DROP TYPE IF EXISTS userrole CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS role_permissions CASCADE;'))
    conn.commit()
    print("User tables and enums dropped successfully.")
