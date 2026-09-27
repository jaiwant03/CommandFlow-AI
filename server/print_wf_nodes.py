import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, name, versionId, nodes FROM workflow_entity WHERE id='AuCa1FhXHnqw12lu';")
row = cursor.fetchone()
wf_id, name, versionId, nodes_json = row
nodes = json.loads(nodes_json)
print(f"Workflow {wf_id} ({name}), Version: {versionId}")
for n in nodes:
    print(f"Node: {n.get('name')} | Type: {n.get('type')} | Disabled: {n.get('disabled')}")
