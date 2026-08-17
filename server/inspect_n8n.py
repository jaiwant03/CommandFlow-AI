import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute('SELECT id, name, nodes, connections FROM workflow_entity WHERE active=1 OR id="AuCa1FhXHnqw12lu";')
rows = cursor.fetchall()
for row in rows:
    print(f"--- WORKFLOW ID: {row[0]}, NAME: {row[1]} ---")
    nodes = json.loads(row[2])
    connections = json.loads(row[3])
    print("NODES:")
    for n in nodes:
        print(f"  Node: {n.get('name')} (Type: {n.get('type')}) Parameters:", json.dumps(n.get('parameters', {})))
    print("CONNECTIONS:")
    print(json.dumps(connections, indent=2))
