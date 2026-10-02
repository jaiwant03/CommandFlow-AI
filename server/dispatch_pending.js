require('dotenv').config();
const mongoose = require('mongoose');
const emailService = require('./services/emailService');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const a = await mongoose.connection.collection('automations').findOne({
    _id: new mongoose.Types.ObjectId('6abf4620f40e3b8ef3f26d3a')
  });

  if (!a) {
    console.log('Automation not found');
    process.exit(1);
  }

  console.log(`Found automation ${a.automationId}: "${a.generatedContent.subject}" to ${a.recipient.email}`);
  const result = await emailService.sendEmail({
    to: [a.recipient.email],
    subject: a.generatedContent.subject,
    content: a.generatedContent.body,
    htmlContent: a.generatedContent.htmlBody
  });

  console.log('Email sent successfully via:', result.provider, 'MessageId:', result.messageId);

  await mongoose.connection.collection('automations').updateOne(
    { _id: a._id },
    {
      $set: {
        status: 'SUCCESS',
        n8nExecutionId: result.messageId,
        completedAt: new Date(),
        lastError: null
      }
    }
  );

  console.log('Automation 6abf4620f40e3b8ef3f26d3a status successfully updated to SUCCESS in MongoDB!');
  process.exit(0);
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
