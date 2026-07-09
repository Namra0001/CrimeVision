import sqlite3
import random

conn = sqlite3.connect('backend/crimevision.db')
c = conn.cursor()

c.execute("SELECT d.DistrictID FROM District d WHERE d.DistrictName = 'Bengaluru Urban'")
dist_id = c.fetchone()[0]

c.execute("SELECT UnitID FROM Unit WHERE DistrictID = ?", (dist_id,))
units = [row[0] for row in c.fetchall()]

print(f"Bengaluru Urban has {len(units)} units.")
updated = 0

for u in units:
    lat = 12.9716 + random.uniform(-0.1, 0.1)
    lng = 77.5946 + random.uniform(-0.1, 0.1)
    c.execute("UPDATE CaseMaster SET latitude = ?, longitude = ? WHERE PoliceStationID = ?", (lat, lng, u))
    updated += c.rowcount

conn.commit()
print(f"Updated {updated} cases in Bengaluru Urban.")
