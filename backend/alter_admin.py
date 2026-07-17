import sqlite3; conn = sqlite3.connect('crimevision.db'); conn.execute('UPDATE user SET is_verified_by_admin = 1 WHERE email = \'admin@ksp.gov.in\''); conn.commit()
