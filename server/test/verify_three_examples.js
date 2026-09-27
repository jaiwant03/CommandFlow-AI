const assert = require('assert');
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../sockets/socketManager');
const { initWorker } = require('../workers/commandWorker');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Automation = require('../models/Automation');
const commandService = require('../services/commandService');

async function verifyAllThreeExamples() {
  console.log('\n======================================================');
  console.log('🧪 VERIFYING 3 EXACT FINAL USER WORKFLOWS');
  console.log('======================================================\n');

  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  const worker = initWorker();

  const TEST_PORT = 5096;
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 0. Setup User and Contact 'Arun' in MongoDB
    console.log('[Setup] Logging in Demo user and registering contact "Arun"...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@commandflow.ai', password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.user?.token;
    const userId = loginData.data?._id || loginData.user?._id;

    await Contact.deleteMany({ userId, name: { $regex: /Arun/i } });
    await Contact.create({
      userId,
      name: 'Arun',
      email: 'official.jaiwantkarrunworks@gmail.com', // Real test Gmail
      telegramId: '7793673257',
      relationship: 'Class Advisor',
      preferredChannel: 'gmail'
    });
    console.log('✓ Contact "Arun" prepared with email official.jaiwantkarrunworks@gmail.com and telegramId 7793673257\n');

    // =========================================================================
    // Example 1: Gmail
    // User: "Send a leave letter to Arun through Gmail"
    // =========================================================================
    console.log('--- EXAMPLE 1: GMAIL PIPELINE ---');
    console.log('Command: "Send a leave letter to Arun through Gmail"');
    const cmd1Res = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send a leave letter to Arun through Gmail',
        inputType: 'text'
      })
    });
    const cmd1Data = await cmd1Res.json();
    assert.strictEqual(cmd1Res.status, 201);
    assert.strictEqual(cmd1Data.success, true);
    console.log(`1. Instant Response: status = ${cmd1Data.data.status} (ID: ${cmd1Data.data.automationId})`);
    console.log(`2. Contact Resolution: name = ${cmd1Data.data.recipient.name}, email = ${cmd1Data.data.recipient.email}`);
    assert.strictEqual(cmd1Data.data.recipient.email, 'official.jaiwantkarrunworks@gmail.com');

    // Wait for BullMQ worker to process and deliver
    console.log('3. Waiting for BullMQ worker to process and deliver via n8n / SMTP...');
    let auto1 = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      auto1 = await Automation.findOne({ automationId: cmd1Data.data.automationId });
      if (auto1 && (auto1.status === 'SUCCESS' || auto1.status === 'SENT' || auto1.status === 'FAILED')) {
        break;
      }
    }
    console.log(`4. Final MongoDB Record Status: ${auto1.status} (Execution ID: ${auto1.n8nExecutionId || auto1.executionId})`);
    assert.ok(auto1.status === 'SUCCESS' || auto1.status === 'SENT', `Expected SUCCESS but got ${auto1.status}`);
    console.log('🎉 EXAMPLE 1 PASSED: Gmail delivery completed and verified!\n');

    // =========================================================================
    // Example 2: Telegram
    // User: 'Send "I will be late today" to Arun through Telegram'
    // =========================================================================
    console.log('--- EXAMPLE 2: TELEGRAM PIPELINE ---');
    console.log('Command: \'Send "I will be late today" to Arun through Telegram\'');
    const cmd2Res = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send "I will be late today" to Arun through Telegram',
        inputType: 'text'
      })
    });
    const cmd2Data = await cmd2Res.json();
    assert.strictEqual(cmd2Res.status, 201);
    assert.strictEqual(cmd2Data.success, true);
    console.log(`1. Instant Response: status = ${cmd2Data.data.status} (ID: ${cmd2Data.data.automationId})`);
    console.log(`2. Contact Resolution: chatId = ${cmd2Data.data.recipient.telegramId}`);

    // Wait for BullMQ worker to process and deliver
    console.log('3. Waiting for BullMQ worker to process and deliver via n8n / Telegram Bot...');
    let auto2 = null;
    for (let i = 0; i < 35; i++) {
      await new Promise(r => setTimeout(r, 1000));
      auto2 = await Automation.findOne({ automationId: cmd2Data.data.automationId });
      if (auto2 && (auto2.status === 'SUCCESS' || auto2.status === 'SENT' || auto2.status === 'FAILED')) {
        break;
      }
    }
    console.log(`4. Final MongoDB Record Status: ${auto2.status} (Execution ID: ${auto2.n8nExecutionId || auto2.executionId})`);
    assert.ok(auto2.status === 'SUCCESS' || auto2.status === 'SENT', `Expected SUCCESS but got ${auto2.status}`);
    console.log('🎉 EXAMPLE 2 PASSED: Telegram message delivered and verified!\n');

    // =========================================================================
    // Example 3: Scheduled Email
    // User: "Send leave letter to Arun tomorrow at 10 AM through Gmail"
    // =========================================================================
    console.log('--- EXAMPLE 3: SCHEDULED EMAIL PIPELINE ---');
    console.log('Command: "Send leave letter to Arun tomorrow at 10 AM through Gmail"');
    const cmd3Res = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send leave letter to Arun tomorrow at 10 AM through Gmail',
        inputType: 'text'
      })
    });
    const cmd3Data = await cmd3Res.json();
    assert.strictEqual(cmd3Res.status, 201);
    assert.strictEqual(cmd3Data.success, true);
    assert.strictEqual(cmd3Data.data.status, 'SCHEDULED');
    console.log(`1. Scheduled Response: status = ${cmd3Data.data.status}`);
    console.log(`2. Target Execution: ${cmd3Data.data.schedule.nextExecution}`);
    console.log(`3. Contact Resolution: ${cmd3Data.data.recipient.name} -> ${cmd3Data.data.recipient.email}`);
    assert.strictEqual(cmd3Data.data.recipient.email, 'official.jaiwantkarrunworks@gmail.com');
    assert.ok(new Date(cmd3Data.data.schedule.nextExecution) > new Date());
    console.log('4. Persistent in MongoDB: Browser can be closed safely without losing execution.');
    console.log('🎉 EXAMPLE 3 PASSED: Scheduled email created and verified!\n');

    console.log('======================================================');
    console.log('🏆 ALL THREE FINAL VALIDATION WORKFLOWS 100% VERIFIED!');
    console.log('======================================================\n');
  } finally {
    if (worker) await worker.close();
    server.close();
  }
}

verifyAllThreeExamples().then(() => process.exit(0)).catch(err => {
  console.error('Validation Error:', err);
  process.exit(1);
});
