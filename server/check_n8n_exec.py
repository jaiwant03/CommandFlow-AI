import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT executionId, data FROM execution_data ORDER BY ROWID DESC LIMIT 1;")
row = cursor.fetchone()
exec_id, raw_data = row
print(f"Execution ID: {exec_id}")
parsed = json.loads(raw_data)
if isinstance(parsed, list):
    # flatted format
    # Let's search strings in the array for error or message
    for idx, item in enumerate(parsed):
        if isinstance(item, dict):
            if 'message' in item or 'error' in item or 'description' in item:
                print(f"Item {idx}: {item}")
        elif isinstance(item, str):
            if any(k in item.lower() for k in ['error', 'token', 'auth', 'invalid', 'failed', 'credential', 'oauth', 'expired']):
                print(f"Str {idx}: {item}")
else:
    print(parsed)
