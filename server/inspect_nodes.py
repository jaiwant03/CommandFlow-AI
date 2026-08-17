import sqlite3, os, json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

row = cursor.execute('SELECT id, name, nodes, connections FROM workflow_entity WHERE active=1 OR id="AuCa1FhXHnqw12lu";').fetchone()
wf_id, name, nodes_str, conn_str = row

nodes = json.loads(nodes_str)
connections = json.loads(conn_str)

for node in nodes:
    print("----------------------------------------")
    print(f"NODE NAME: {node.get('name')}")
    print("PARAMETERS:")
    print(json.dumps(node.get('parameters', {}), indent=2))

print("----------------------------------------")
print("CONNECTIONS:")
print(json.dumps(connections, indent=2))
