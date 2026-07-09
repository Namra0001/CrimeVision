import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv('DATABASE_URL'))
conn = engine.connect()

conn.execute(text('ALTER TABLE accused ADD COLUMN IF NOT EXISTS "RepeatOffender" BOOLEAN;'))
conn.execute(text('ALTER TABLE accused ADD COLUMN IF NOT EXISTS "GangID" VARCHAR;'))
conn.execute(text('ALTER TABLE accused ADD COLUMN IF NOT EXISTS "Phone" VARCHAR;'))

conn.commit()
conn.close()
print('Table altered successfully')
