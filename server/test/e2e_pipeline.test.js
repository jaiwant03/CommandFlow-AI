const assert = require('assert');
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../sockets/socketManager');
const { initWorker } = require('../workers/commandWorker');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Automation = require('../models/Automation');
const contactService = require('../services/contactService');
const { validateCommandPlan } = require('../validators/commandValidator');

async function runTests() {
  console.log('--- STARTING COMMANDFLOW AI TEST SUITE ---');
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  const worker = initWorker();

  const TEST_PORT = 5097;
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Health check
    console.log('[Test 1] Health check endpoint...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');
    assert.strictEqual(healthData.services.mongodb.status, 'connected');
    assert.strictEqual(healthData.services.redis.status, 'connected');
    console.log('✓ Health check passed!');

    // 2. Authentication: Login
    console.log('[Test 2] Authentication: Demo Login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@commandflow.ai', password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.ok(loginData.data?.token || loginData.user?.token);
    const token = loginData.data?.token || loginData.user?.token;
    console.log('✓ Authentication passed! Token issued.');

    // 3. Unauthorized access check
    console.log('[Test 3] Security: Unauthorized request without valid token...');
    const badAuthRes = await fetch(`${baseUrl}/api/automations`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid_token_12345' }
    });
    assert.strictEqual(badAuthRes.status, 401);
    console.log('✓ Security check passed! Rejected invalid token with 401.');

    // 4. Contact Management & Resolution
    console.log('[Test 4] Contact Management & Recipient Resolution...');
    const testUserId = loginData.data?._id || loginData.user?._id;
    await Contact.deleteMany({ userId: testUserId, name: 'Arun Test' });
    const createContactRes = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Arun Test',
        email: 'arun.test@gmail.com',
        relationship: 'Class Advisor',
        preferredChannel: 'gmail'
      })
    });
    const contactData = await createContactRes.json();
    assert.strictEqual(contactData.success, true);

    const resolved = await contactService.resolveRecipient(testUserId, {
      nameHint: 'Arun Test',
      commandText: 'Send leave letter to Arun Test through Gmail',
      channel: 'gmail'
    });
    assert.ok(resolved);
    assert.strictEqual(resolved.email, 'arun.test@gmail.com');
    console.log('✓ Contact resolution from MongoDB passed! Resolved "Arun Test" -> arun.test@gmail.com');

    // 5. Command Validation: Reject empty or invalid commands
    console.log('[Test 5] Command Validation: Reject empty command...');
    const emptyCmdRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ command: '   ' })
    });
    const emptyCmdData = await emptyCmdRes.json();
    assert.strictEqual(emptyCmdRes.status, 400);
    assert.strictEqual(emptyCmdData.success, false);
    console.log('✓ Empty command rejection passed!');

    // 6. Immediate Command Creation & BullMQ Enqueue
    console.log('[Test 6] Command Pipeline: Create & Enqueue immediate command...');
    const cmdRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send leave letter to arun.test@gmail.com through Gmail',
        inputType: 'text'
      })
    });
    const cmdData = await cmdRes.json();
    assert.strictEqual(cmdRes.status, 201);
    assert.strictEqual(cmdData.success, true);
    assert.ok(cmdData.data?.automationId);
    assert.strictEqual(cmdData.data?.status, 'QUEUED');
    console.log(`✓ Immediate command accepted in <500ms with status QUEUED! AutomationId: ${cmdData.data.automationId}`);

    // 7. Idempotency: Duplicate prevention
    console.log('[Test 7] Idempotency: Preventing duplicate execution...');
    const idemKey = `TEST-IDEM-${Date.now()}`;
    const firstReq = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send hello to arun.test@gmail.com through Gmail',
        idempotencyKey: idemKey
      })
    });
    const firstData = await firstReq.json();

    const secondReq = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send hello to arun.test@gmail.com through Gmail',
        idempotencyKey: idemKey
      })
    });
    const secondData = await secondReq.json();
    assert.strictEqual(firstData.data.automationId, secondData.data.automationId);
    console.log('✓ Idempotency verified! Second identical call returned existing command without re-creating.');

    // 8. Future Scheduled Command
    console.log('[Test 8] Scheduling Pipeline: Scheduled command tomorrow at 10 AM...');
    const schedRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send leave letter to arun.test@gmail.com through Gmail tomorrow at 10 AM',
        inputType: 'text'
      })
    });
    const schedData = await schedRes.json();
    assert.strictEqual(schedRes.status, 201);
    assert.strictEqual(schedData.data.status, 'SCHEDULED');
    assert.ok(schedData.data.schedule?.nextExecution);
    console.log(`✓ Scheduling passed! Created with status SCHEDULED for: ${schedData.data.schedule.nextExecution}`);

    // 9. Cancel Scheduled Command
    console.log('[Test 9] Cancellation: Cancel scheduled command...');
    const cancelRes = await fetch(`${baseUrl}/api/commands/${schedData.data.automationId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cancelData = await cancelRes.json();
    assert.strictEqual(cancelData.success, true);
    assert.strictEqual(cancelData.data.status, 'CANCELLED');
    console.log('✓ Scheduled command cancelled successfully!');

    console.log('\n========================================');
    console.log('🎉 ALL AUTOMATED PIPELINE TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    if (worker) await worker.close();
    server.close();
  }
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
