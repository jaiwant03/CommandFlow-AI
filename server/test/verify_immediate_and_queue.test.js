const assert = require('assert');
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');
const { initSocket } = require('../sockets/socketManager');
const { initWorker } = require('../workers/commandWorker');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Automation = require('../models/Automation');
const ActivityLog = require('../models/ActivityLog');
const { resetStaleExecutions } = require('../services/executionManager');

async function testImmediateAndQueue() {
  console.log('\n===============================================================');
  console.log('🧪 TESTING IMMEDIATE EXECUTION VS BULLMQ QUEUEING PIPELINE');
  console.log('===============================================================\n');

  await connectDB();
  await resetStaleExecutions();

  const server = http.createServer(app);
  initSocket(server);
  const worker = initWorker();

  const TEST_PORT = 5099;
  await new Promise(resolve => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Authenticate Demo User
    console.log('[Step 1] Logging in Demo user...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@commandflow.ai', password: 'demo1234' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    const token = loginData.data?.token || loginData.user?.token;
    const userId = loginData.data?._id || loginData.user?._id;
    console.log('✓ Demo user logged in.');

    // 2. Register contact 'Arun' for tests
    await Contact.deleteMany({ userId, name: 'Arun QueueTest' });
    await Contact.create({
      userId,
      name: 'Arun QueueTest',
      email: 'arun.queuetest@gmail.com',
      preferredChannel: 'gmail'
    });

    // -------------------------------------------------------------
    // TEST A: SINGLE MESSAGE (System Idle) -> MUST EXECUTE IMMEDIATELY
    // -------------------------------------------------------------
    console.log('\n--- TEST A: SINGLE MESSAGE (IDLE SYSTEM) ---');
    console.log('Sending single command: "Send leave letter to Arun QueueTest through Gmail"...');

    const singleRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        command: 'Send leave letter to Arun QueueTest through Gmail',
        inputType: 'text'
      })
    });
    const singleData = await singleRes.json();

    assert.strictEqual(singleRes.status, 200);
    assert.strictEqual(singleData.success, true);
    assert.strictEqual(singleData.data?.status, 'SUCCESS');
    console.log(`✓ TEST A PASSED: Single command returned status SUCCESS immediately without queue delay! (ID: ${singleData.data.automationId})`);
    console.log(`  Response message: "${singleData.message}"`);

    // Verify activity log for single message
    const singleLogs = await ActivityLog.find({ automationId: singleData.data.automationId });
    const logMessages = singleLogs.map(l => l.message).join(' | ');
    console.log(`  Activity log excerpt: ${logMessages.substring(0, 120)}...`);

    // -------------------------------------------------------------
    // TEST B: MULTIPLE MESSAGES (Concurrent / Rapid) -> 2nd & 3rd MUST QUEUE IN BULLMQ
    // -------------------------------------------------------------
    console.log('\n--- TEST B: MULTIPLE CONCURRENT MESSAGES ---');
    console.log('Submitting 3 commands in rapid succession...');

    const p1 = fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        command: 'Send Project Status to Arun QueueTest through Gmail',
        inputType: 'text'
      })
    });

    // Slight offset to simulate rapid sequential clicks
    await new Promise(r => setTimeout(r, 60));
    const p2 = fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        command: 'Send Meeting Notes to Arun QueueTest through Gmail',
        inputType: 'text'
      })
    });

    await new Promise(r => setTimeout(r, 60));
    const p3 = fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        command: 'Send Invoice Summary to Arun QueueTest through Gmail',
        inputType: 'text'
      })
    });

    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);

    console.log(`Cmd 1: status=${d1.data?.status}, message="${d1.message}"`);
    console.log(`Cmd 2: status=${d2.data?.status}, message="${d2.message}"`);
    console.log(`Cmd 3: status=${d3.data?.status}, message="${d3.message}"`);

    // First command executed immediately or processing
    assert.ok(d1.data?.status === 'SUCCESS' || d1.data?.status === 'PROCESSING');

    // Second and third commands MUST be queued in BullMQ!
    assert.strictEqual(d2.data?.status, 'QUEUED', `Expected Cmd 2 to be QUEUED, but got: ${d2.data?.status}`);
    assert.strictEqual(d3.data?.status, 'QUEUED', `Expected Cmd 3 to be QUEUED, but got: ${d3.data?.status}`);
    assert.ok(d2.message.includes('queued') || d2.message.includes('Queued'));
    assert.ok(d3.message.includes('queued') || d3.message.includes('Queued'));
    console.log('✓ TEST B PASSED: Cmd 2 and Cmd 3 were queued into BullMQ while Cmd 1 was executing!');

    // -------------------------------------------------------------
    // TEST C: BULLMQ SEQUENTIAL DRAIN
    // Wait for the worker to drain the queued jobs
    // -------------------------------------------------------------
    console.log('\n--- TEST C: WAITING FOR BULLMQ WORKER TO PROCESS QUEUED JOBS ---');
    const autoIds = [d1.data.automationId, d2.data.automationId, d3.data.automationId];

    let allCompleted = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 1000));
      const records = await Automation.find({ automationId: { $in: autoIds } });
      const completed = records.filter(r => r.status === 'SUCCESS' || r.status === 'SENT');
      console.log(`[Attempt ${attempt + 1}/30] Completed: ${completed.length}/3 (${records.map(r => `${r.automationId}:${r.status}`).join(', ')})`);
      if (completed.length === 3) {
        allCompleted = true;
        break;
      }
    }

    assert.ok(allCompleted, 'Expected all 3 commands to eventually reach SUCCESS via BullMQ worker processing');
    console.log('✓ TEST C PASSED: All queued commands were processed sequentially and delivered successfully!');

    // -------------------------------------------------------------
    // TEST D: SYSTEM RETURNS TO IDLE -> NEXT COMMAND RUNS IMMEDIATELY
    // -------------------------------------------------------------
    console.log('\n--- TEST D: POST-QUEUE IDLE IMMEDIATE EXECUTION ---');
    console.log('Queue has drained. Sending new command...');
    const postRes = await fetch(`${baseUrl}/api/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        command: 'Send Farewell Note to Arun QueueTest through Gmail',
        inputType: 'text'
      })
    });
    const postData = await postRes.json();
    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postData.data?.status, 'SUCCESS');
    console.log(`✓ TEST D PASSED: Once queue drained, new command executed immediately with status SUCCESS! (ID: ${postData.data.automationId})`);

    console.log('\n===============================================================');
    console.log('🎉 ALL IMMEDIATE VS QUEUED BULLMQ TESTS PASSED PERFECTLY!');
    console.log('===============================================================\n');
  } finally {
    if (worker) await worker.close();
    server.close();
  }
}

testImmediateAndQueue().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
