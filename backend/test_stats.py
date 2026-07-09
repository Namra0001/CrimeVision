from app.db.session import SessionLocal
from app.api.dashboard_api import get_dashboard_stats
import json
db = SessionLocal()
try:
    stats = get_dashboard_stats(db)
    print(json.dumps(stats, default=str))
finally:
    db.close()
