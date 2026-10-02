require('./config/env');
const connectDB = require('./config/db');
const commandService = require('./services/commandService');
const Automation = require('./models/Automation');

(async () => {
  await connectDB();
  console.log('Processing command: "send a Bonafide letter to Jaswant"...');
  const res = await commandService.processAndEnqueueCommand({
    userId: '6a7a1a684959ef134f79721d',
    command: 'send a Bonafide letter to Jaswant',
    inputType: 'text',
    attachments: []
  });
  const autoId = res.automation.automationId;
  console.log('Enqueued automation ID:', autoId);

  // Poll for completion up to 10 seconds
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const record = await Automation.findOne({ automationId: autoId }).lean();
    console.log(`[Check ${i + 1}] Status: ${record.status}, n8nExecutionId: ${record.n8nExecutionId}`);
    if (record.status === 'SUCCESS' || record.status === 'FAILED') {
      console.log('FINAL RECORD:', {
        id: record.automationId,
        status: record.status,
        recipient: record.recipient?.email,
        n8nExecutionId: record.n8nExecutionId,
        error: record.error
      });
      break;
    }
  }
  process.exit(0);
})();
