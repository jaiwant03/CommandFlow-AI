require('dotenv').config();
const mongoose = require('mongoose');
const Schedule = require('./models/Schedule');
const Automation = require('./models/Automation');
const ActivityLog = require('./models/ActivityLog');
const groqService = require('./services/groqService');
const { initScheduler } = require('./services/schedulerService');

async function testScheduledDelivery() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Initialize scheduler worker
  initScheduler();

  const command = 'send a leave letter to jaisam710@gmail.com as i am suffering from fever in about 500 words for sending to my class mentor jaswant sir through gmail after 10 seconds';
  console.log('Processing command via Groq AI:', command);

  const aiParsed = await groqService.processCommand({ userCommand: command });
  console.log('AI Parsed Schedule Info:', aiParsed.schedule);
  console.log('Recipients:', aiParsed.recipients);

  const testAutomationId = `TEST-SCHED-${Date.now()}`;
  const executeAt = new Date(Date.now() + 8000); // 8 seconds from now

  console.log(`Creating test scheduled automation (${testAutomationId}) set for execution at: ${executeAt.toISOString()} (current: ${new Date().toISOString()})...`);

  const auto = await Automation.create({
    automationId: testAutomationId,
    userId: '65b820a1c1d4a90012345678',
    originalCommand: command,
    language: 'english',
    inputType: 'text',
    intent: 'send_email',
    channel: 'gmail',
    recipient: {
      name: 'jaisam710',
      email: 'jaisam710@gmail.com',
      recipients: ['jaisam710@gmail.com']
    },
    generatedContent: {
      subject: aiParsed.subject || 'Leave Application Due to Fever',
      body: aiParsed.message || 'Dear Class Mentor,\n\nI am writing to formally request leave due to high fever.\n\nRegards,\nJaiwant Karrun',
      htmlBody: aiParsed.htmlBody || ''
    },
    schedule: {
      date: executeAt.toLocaleDateString('en-IN'),
      time: executeAt.toLocaleTimeString('en-IN'),
      nextExecution: executeAt
    },
    status: 'SCHEDULED'
  });

  const sched = await Schedule.create({
    userId: '65b820a1c1d4a90012345678',
    automationId: testAutomationId,
    command: command,
    scheduleDetails: {
      date: executeAt.toLocaleDateString('en-IN'),
      time: executeAt.toLocaleTimeString('en-IN')
    },
    nextExecution: executeAt,
    status: 'SCHEDULED'
  });

  console.log('Schedule created in DB. Waiting for Scheduler Worker to pick it up (up to 25s)...');

  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const checkSched = await Schedule.findOne({ automationId: testAutomationId });
    process.stdout.write(`Second ${i + 1}: status = ${checkSched.status}\r`);

    if (checkSched.status === 'SUCCESS') {
      console.log('\n\nSUCCESS! Scheduled automation executed!');
      const checkAuto = await Automation.findOne({ automationId: testAutomationId });
      console.log('Automation status:', checkAuto.status);
      console.log('Execution ID:', checkAuto.n8nExecutionId);
      const logs = await ActivityLog.find({ automationId: testAutomationId });
      console.log('Logs:');
      logs.forEach(l => console.log(' -', l.action, ':', l.message));
      process.exit(0);
    }
  }

  console.log('\nTimeout waiting for schedule execution.');
  process.exit(1);
}

testScheduledDelivery().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
