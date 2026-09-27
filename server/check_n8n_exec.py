import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
print("Tables:", [t[0] for t in cursor.fetchall()])

cursor.execute("PRAGMA table_info(execution_data);")
cols = cursor.fetchall()
print("execution_data columns:", cols)

cursor.execute("SELECT * FROM execution_data ORDER BY ROWID DESC LIMIT 1;")
row = cursor.fetchone()
if row:
    print("Found execution_data row:")
    for idx, c in enumerate(cols):
        val = str(row[idx])
        if len(val) > 200:
            val = val[:200] + "... (truncated)"
        print(f"  {c[1]}: {val}")

    # Parse full json
    full_data = row[1] if len(row) > 1 else None
    if full_data:
        try:
            d = json.loads(full_data)
            print("\nRESULT DATA KEYS:", d.keys())
            if 'resultData' in d:
                res = d['resultData']
                print("resultData keys:", res.keys())
                if 'error' in res:
                    print("\nERROR IN EXECUTION:")
                    print(json.dumps(res['error'], indent=2))
                if 'runData' in res:
                    print("\nRUN DATA NODES:", list(res['runData'].keys()))
                    for node_name, runs in res['runData'].items():
                        for r in runs:
                            if 'error' in r:
                                print(f"ERROR IN NODE '{node_name}':", r['error'])
        except Exception as e:
            print("Parse error:", e)
