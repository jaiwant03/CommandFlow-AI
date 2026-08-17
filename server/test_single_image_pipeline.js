require('dotenv').config({ path: 'c:/Dev/Projects/Commandflow AI/server/.env' });
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '65b820a1c1d4a90012345678' }, process.env.JWT_SECRET || 'commandflow_ai_super_secret_jwt_key_2026');
const axios = require('axios');
const FormData = require('form-data');

async function testPipeline() {
  console.log("=== TEST 1: NO IMAGE ATTACHED ===");
  try {
    const res1 = await axios.post('http://localhost:5000/api/automations', {
      command: 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com',
      inputType: 'text',
      attachments: []
    }, { headers: { Authorization: 'Bearer ' + token } });
    console.log("Test 1 Result:", res1.data.success ? 'SUCCESS' : 'FAILED', "Status:", res1.data.data.status, "Attachments:", res1.data.data.attachments.length);
    const html1 = res1.data.data.generatedContent.htmlBody || '';
    const imgCount1 = (html1.match(/<img/gi) || []).length;
    console.log("Test 1 HTML Image Tag Count:", imgCount1);
  } catch(e) {
    console.error("Test 1 Error:", e.response ? e.response.data : e.message);
  }

  console.log("\n=== TEST 2: ONE UPLOADED IMAGE ===");
  try {
    const form2 = new FormData();
    form2.append('command', 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com');
    form2.append('inputType', 'text');
    const dummyBuffer2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    form2.append('image', dummyBuffer2, { filename: 'sample_bonafide.png', contentType: 'image/png' });

    const res2 = await axios.post('http://localhost:5000/api/automations', form2, {
      headers: { ...form2.getHeaders(), Authorization: 'Bearer ' + token }
    });
    console.log("Test 2 Result:", res2.data.success ? 'SUCCESS' : 'FAILED', "Status:", res2.data.data.status, "Attachments:", res2.data.data.attachments.length);
    const html2 = res2.data.data.generatedContent.htmlBody || '';
    const imgCount2 = (html2.match(/<img/gi) || []).length;
    console.log("Test 2 HTML Image Tag Count:", imgCount2);
    console.log("Contains cid:uploaded-image?", html2.includes('cid:uploaded-image'));
  } catch(e) {
    console.error("Test 2 Error:", e.response ? e.response.data : e.message);
  }

  console.log("\n=== TEST 3: DIFFERENT UPLOADED IMAGE ===");
  try {
    const form3 = new FormData();
    form3.append('command', 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com');
    form3.append('inputType', 'text');
    const dummyBuffer3 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjDAGADc7BgQA7f2i5gAAAABJRU5ErkJggg==', 'base64');
    form3.append('image', dummyBuffer3, { filename: 'new_id_card.png', contentType: 'image/png' });

    const res3 = await axios.post('http://localhost:5000/api/automations', form3, {
      headers: { ...form3.getHeaders(), Authorization: 'Bearer ' + token }
    });
    console.log("Test 3 Result:", res3.data.success ? 'SUCCESS' : 'FAILED', "Status:", res3.data.data.status, "Attachments:", res3.data.data.attachments.length);
    const html3 = res3.data.data.generatedContent.htmlBody || '';
    const imgCount3 = (html3.match(/<img/gi) || []).length;
    console.log("Test 3 HTML Image Tag Count:", imgCount3);
  } catch(e) {
    console.error("Test 3 Error:", e.response ? e.response.data : e.message);
  }
}

testPipeline();
