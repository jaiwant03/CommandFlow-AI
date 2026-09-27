import sqlite3
import os
import json
import uuid

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

new_version = str(uuid.uuid4())
cursor.execute("UPDATE workflow_entity SET versionId=? WHERE id='AuCa1FhXHnqw12lu';", (new_version,))
conn.commit()
print("Updated versionId to:", new_version)

cursor.execute("SELECT id, name, versionId FROM workflow_entity WHERE id='AuCa1FhXHnqw12lu';")
print("Confirmed row:", cursor.fetchone())
conn.close()
