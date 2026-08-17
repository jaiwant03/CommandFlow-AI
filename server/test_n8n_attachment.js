require('dotenv').config({ path: 'c:/Dev/Projects/Commandflow AI/server/.env' });
const n8nService = require('./services/n8nService');
const groqService = require('./services/groqService');

async function runTests() {
  console.log("=== TEST 1: WITHOUT IMAGE ATTACHMENT ===");
  const cmd1 = "Send an email to test@example.com saying hello";
  const parsed1 = await groqService.processCommand(cmd1);
  console.log("Groq Parsed Subject 1:", parsed1.subject);
  console.log("Groq Parsed Message 1:", parsed1.message);
  
  const res1 = await n8nService.triggerWorkflow({
    automationId: 'test-no-att-' + Date.now(),
    userCommand: cmd1,
    channel: 'gmail',
    recipient: parsed1.recipient,
    recipients: parsed1.recipients,
    subject: parsed1.subject,
    message: parsed1.message,
    content: parsed1.message,
    htmlContent: parsed1.htmlBody,
    attachments: []
  });
  console.log("n8n Dispatch Result 1:", res1);

  console.log("\n=== TEST 2: WITH IMAGE ATTACHMENT ===");
  const cmd2 = "Send an email to test@example.com saying hello";
  // 1x1 transparent PNG base64
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const dummyAttachment = [{
    filename: "test_image.png",
    contentType: "image/png",
    data: dummyBase64,
    buffer: Buffer.from(dummyBase64, 'base64')
  }];

  const parsed2 = await groqService.processCommand(cmd2, dummyAttachment);
  console.log("Groq Parsed Subject 2:", parsed2.subject);
  console.log("Groq Parsed Message 2:", parsed2.message);

  const res2 = await n8nService.triggerWorkflow({
    automationId: 'test-with-att-' + Date.now(),
    userCommand: cmd2,
    channel: 'gmail',
    recipient: parsed2.recipient,
    recipients: parsed2.recipients,
    subject: parsed2.subject,
    message: parsed2.message,
    content: parsed2.message,
    htmlContent: parsed2.htmlBody,
    attachments: dummyAttachment
  });
  console.log("n8n Dispatch Result 2:", res2);
}

runTests();
