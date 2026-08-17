import sqlite3
import os
import json

db_path = os.path.expanduser('~/.n8n/database.sqlite')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT id, name, nodes, connections FROM workflow_entity WHERE active=1 OR id="AuCa1FhXHnqw12lu";')
rows = cursor.fetchall()

updated_count = 0

for row in rows:
    wf_id, name, nodes_str, conn_str = row
    nodes = json.loads(nodes_str)
    connections = json.loads(conn_str)

    for node in nodes:
        node_name = node.get('name', '')

        # 1. Update Validate Recipient node code
        if node_name == 'Validate Recipient':
            new_code = (
                "const item = $input.item;\n"
                "const body = item.json.body || item.json;\n\n"
                "let rawRecipient = body.recipientEmail || body.toEmail || body.to || (typeof body.recipient === 'object' ? body.recipient?.email : body.recipient);\n\n"
                "if (typeof rawRecipient === 'string' && rawRecipient.startsWith('{')) {\n"
                "  try {\n"
                "    const parsed = JSON.parse(rawRecipient);\n"
                "    rawRecipient = parsed.email || parsed.to || rawRecipient;\n"
                "  } catch (e) {}\n"
                "}\n\n"
                "let cleanRecipient = String(rawRecipient || '').trim().toLowerCase().replace(/\\s+/g, '');\n"
                "const isValid = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(cleanRecipient);\n\n"
                "if (!isValid) {\n"
                "  throw new Error(`[n8n Validation Error] Invalid recipient email address: '${rawRecipient}'. Evaluated recipient: '${cleanRecipient}'`);\n"
                "}\n\n"
                "const hasBinary = !!(item.binary && Object.keys(item.binary).length > 0);\n"
                "const rawHasAtt = body.hasAttachment;\n"
                "const bodyHasAtt = rawHasAtt === true || rawHasAtt === 'true' || (Array.isArray(body.attachments) && body.attachments.length > 0);\n"
                "const isAttachment = Boolean(hasBinary || bodyHasAtt);\n\n"
                "const subject = String(body.subject || item.json.subject || '').trim();\n"
                "const message = String(body.message || body.content || body.htmlContent || item.json.message || item.json.content || '').trim();\n\n"
                "let finalBinary = item.binary || {};\n"
                "if (isAttachment && !finalBinary.data && Object.keys(finalBinary).length > 0) {\n"
                "  finalBinary.data = finalBinary.image || finalBinary.attachment_0 || Object.values(finalBinary)[0];\n"
                "}\n\n"
                "return {\n"
                "  json: {\n"
                "    ...item.json,\n"
                "    hasAttachment: isAttachment,\n"
                "    recipient: cleanRecipient,\n"
                "    subject: subject,\n"
                "    message: message,\n"
                "    resolvedToEmail: cleanRecipient,\n"
                "    toEmail: cleanRecipient\n"
                "  },\n"
                "  binary: finalBinary\n"
                "};"
            )
            node['parameters']['jsCode'] = new_code

        # 2. Update Has Attachment? condition
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

        # 3. Update Gmail (With Attachment) node parameters
        elif node_name == 'Send a message (With Attachment)' or node_name == 'Gmail (With Attachment)':
            params = node.get('parameters', {})
            to_val = "={{ $json.resolvedToEmail || $json.toEmail || $json.recipient || $json.body?.recipients?.[0] || $json.body?.recipientEmail || $json.body?.toEmail || $json.body?.to }}"
            subj_val = "={{ $json.subject || $json.body?.subject }}"
            msg_val = "={{ $json.message || $json.body?.message || $json.body?.htmlContent || $json.body?.content }}"
            
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

        # 4. Update Gmail (Text Only) node parameters
        elif node_name == 'Send a message (Text Only)' or node_name == 'Send a message1' or node_name == 'Gmail (Text Only)':
            params = node.get('parameters', {})
            to_val = "={{ $json.resolvedToEmail || $json.toEmail || $json.recipient || $json.body?.recipients?.[0] || $json.body?.recipientEmail || $json.body?.toEmail || $json.body?.to }}"
            subj_val = "={{ $json.subject || $json.body?.subject }}"
            msg_val = "={{ $json.message || $json.body?.message || $json.body?.htmlContent || $json.body?.content }}"
            
            params['toEmail'] = to_val
            params['sendTo'] = to_val
            params['subject'] = subj_val
            params['htmlBody'] = msg_val
            params['message'] = msg_val
            node['parameters'] = params

    # Update database
    new_nodes_str = json.dumps(nodes)
    cursor.execute('UPDATE workflow_entity SET nodes=? WHERE id=?;', (new_nodes_str, wf_id))
    conn.commit()
    updated_count += 1
    print(f"Successfully updated workflow '{name}' (ID: {wf_id}) in SQLite DB.")

conn.close()
print(f"Total workflows updated: {updated_count}")
