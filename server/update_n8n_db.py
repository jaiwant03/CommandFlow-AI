import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT id, name, nodes, connections FROM workflow_entity WHERE active=1 OR id="AuCa1FhXHnqw12lu";')
row = cursor.fetchone()
wf_id, name, nodes_str, conn_str = row

nodes = json.loads(nodes_str)
connections = json.loads(conn_str)

for node in nodes:
    print(f"=== NODE: {node.get('name')} ===")
    print(json.dumps(node, indent=2))
    print("\n")
