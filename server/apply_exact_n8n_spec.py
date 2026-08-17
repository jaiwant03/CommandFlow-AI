import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT id, name, nodes, connections FROM workflow_entity WHERE active=1 OR id="AuCa1FhXHnqw12lu";')
rows = cursor.fetchall()

updated_count = 0

exact_validate_code = """const item = $input.item;
const body = item.json.body || item.json;

// 1. Recipient extraction & validation
let rawRecipient = body.recipientEmail || body.toEmail || body.to || (typeof body.recipient === 'object' ? body.recipient?.email : body.recipient);

if (typeof rawRecipient === 'string' && rawRecipient.startsWith('{')) {
  try {
    const parsed = JSON.parse(rawRecipient);
    rawRecipient = parsed.email || parsed.to || rawRecipient;
  } catch (e) {}
}

let cleanRecipient = String(rawRecipient || '').trim().toLowerCase().replace(/\\s+/g, '');
const isValid = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(cleanRecipient);

if (!isValid) {
  throw new Error(`[n8n Validation Error] Invalid recipient email address: '${rawRecipient}'`);
}

// 2. Binary property normalization: keep ONLY binary.data
let binary = item.binary || {};
const binaryKeys = Object.keys(binary);
if (binaryKeys.length > 0 && !binary.data) {
  binary.data = binary[binaryKeys[0]];
}

// Clean binary object so it only contains 'data'
const cleanBinary = {};
if (binary.data) {
  cleanBinary.data = binary.data;
}
item.binary = cleanBinary;

// 3. Attachment detection flag
const rawHasAtt = body.hasAttachment;
const hasBinary = Boolean(item.binary?.data);
const bodyHasAtt = rawHasAtt === true || rawHasAtt === 'true' || (Array.isArray(body.attachments) && body.attachments.length > 0);
const isAttachment = Boolean(hasBinary || bodyHasAtt);

const subject = String(body.subject || item.json.subject || '').trim();
const message = String(body.message || body.content || body.htmlContent || item.json.message || item.json.content || '').trim();
const htmlBody = String(body.htmlBody || body.htmlContent || item.json.htmlBody || item.json.htmlContent || '').trim();

item.json = {
  ...item.json,
  hasAttachment: isAttachment,
  recipient: cleanRecipient,
  resolvedToEmail: cleanRecipient,
  toEmail: cleanRecipient,
  subject: subject,
  message: message,
  htmlContent: htmlBody || message,
  htmlBody: htmlBody || message
};

return item;"""

for row in rows:
    wf_id, name, nodes_str, conn_str = row
    nodes = json.loads(nodes_str)
    connections = json.loads(conn_str)

    for node in nodes:
        node_name = node.get('name', '')

        if node_name == 'Validate Recipient':
            node['parameters']['jsCode'] = exact_validate_code

        elif node_name == 'Has Attachment?' or node_name == 'If':
            node['parameters']['conditions'] = {
                "options": {
                    "caseSensitive": True,
                    "leftValue": "",
                    "typeValidation": "loose",
                    "version": 2
                },
                "conditions": [
                    {
                        "id": "has-att-cond-1",
                        "leftValue": "={{ $json.hasAttachment }}",
                        "rightValue": True,
                        "operator": {
                            "type": "boolean",
                            "operation": "true"
                        }
                    }
                ],
                "combinator": "and"
            }

        elif node_name == 'Send a message (With Attachment)' or node_name == 'Gmail (With Attachment)':
            params = node.get('parameters', {})
            to_val = "={{ $json.resolvedToEmail || $json.toEmail || $json.recipient || $json.body?.recipients?.[0] || $json.body?.recipientEmail || $json.body?.toEmail || $json.body?.to }}"
            subj_val = "={{ $json.subject || $json.body?.subject }}"
            msg_val = "={{ $json.htmlBody || $json.htmlContent || $json.message || $json.body?.htmlBody || $json.body?.htmlContent || $json.body?.message }}"
            
            params['toEmail'] = to_val
            params['sendTo'] = to_val
            params['subject'] = subj_val
            params['htmlBody'] = msg_val
            params['message'] = msg_val
            params['options'] = {
                "attachmentsUi": {
                    "attachmentsBinary": [
                        {
                            "property": "data"
                        }
                    ]
                }
            }
            node['parameters'] = params

        elif node_name == 'Send a message (Text Only)' or node_name == 'Send a message1' or node_name == 'Gmail (Text Only)':
            params = node.get('parameters', {})
            to_val = "={{ $json.resolvedToEmail || $json.toEmail || $json.recipient || $json.body?.recipients?.[0] || $json.body?.recipientEmail || $json.body?.toEmail || $json.body?.to }}"
            subj_val = "={{ $json.subject || $json.body?.subject }}"
            msg_val = "={{ $json.htmlBody || $json.htmlContent || $json.message || $json.body?.htmlBody || $json.body?.htmlContent || $json.body?.message }}"
            
            params['toEmail'] = to_val
            params['sendTo'] = to_val
            params['subject'] = subj_val
            params['htmlBody'] = msg_val
            params['message'] = msg_val
            node['parameters'] = params

    new_nodes_str = json.dumps(nodes)
    cursor.execute('UPDATE workflow_entity SET nodes=? WHERE id=?;', (new_nodes_str, wf_id))
    conn.commit()
    updated_count += 1
    print(f"Successfully updated workflow '{name}' (ID: {wf_id}) in SQLite DB.")

conn.close()
print(f"Total workflows updated: {updated_count}")
