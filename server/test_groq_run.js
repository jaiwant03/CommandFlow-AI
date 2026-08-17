require('dotenv').config({ path: 'c:/Dev/Projects/Commandflow AI/server/.env' });
const groqService = require('./services/groqService');

async function testAll() {
  const commands = [
    "send a bona fide request letter to official.jaiwantkarrunworks@gmail.com through gmail",
    "send an apology email to abc@gmail.com",
    "send a leave request to abc@gmail.com because I am sick",
    "send my project submission email to abc@gmail.com saying I have attached my project",
    "send a meeting request to abc@gmail.com for tomorrow"
  ];

  for (const cmd of commands) {
    console.log("\n==========================================");
    console.log("USER COMMAND:", cmd);
    try {
      const res = await groqService.processCommand(cmd);
      console.log("INTENT:", res.intent);
      console.log("CHANNEL:", res.channel);
      console.log("RECIPIENTS:", res.recipients);
      console.log("SUBJECT:", res.subject);
      console.log("MESSAGE:\n" + res.message);
    } catch (err) {
      console.error("ERROR:", err.message);
    }
  }
}

testAll();
