require('dotenv').config({ path: 'c:/Dev/Projects/Commandflow AI/server/.env' });
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: '65b820a1c1d4a90012345678' }, process.env.JWT_SECRET || 'commandflow_ai_super_secret_jwt_key_2026');
const axios = require('axios');
const FormData = require('form-data');

async function runTests() {
  console.log("=== TEST 1: NO IMAGE ===");
  try {
    const res1 = await axios.post('http://localhost:5000/api/automations', {
      command: 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com',
      inputType: 'text',
      attachments: []
    }, { headers: { Authorization: 'Bearer ' + token } });
    console.log("TEST 1 STATUS:", res1.data.success ? 'SUCCESS' : 'FAILED', "ATTACHMENTS:", res1.data.data.attachments.length);
  } catch (e) {
    console.error("TEST 1 ERR:", e.response ? e.response.data : e.message);
  }

  console.log("\n=== TEST 2: ONE UPLOADED IMAGE ===");
  try {
    const form2 = new FormData();
    form2.append('command', 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com');
    form2.append('inputType', 'text');
    const dummyBuffer2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    form2.append('image', dummyBuffer2, { filename: 'sample_bonafide_letter.png', contentType: 'image/png' });

    const res2 = await axios.post('http://localhost:5000/api/automations', form2, {
      headers: { ...form2.getHeaders(), Authorization: 'Bearer ' + token }
    });
    console.log("TEST 2 STATUS:", res2.data.success ? 'SUCCESS' : 'FAILED', "ATTACHMENTS:", res2.data.data.attachments.length);
    const html2 = res2.data.data.generatedContent.htmlBody || '';
    console.log("TEST 2 CONTAINS BROKEN IMG TAGS?", html2.includes('<img'));
  } catch (e) {
    console.error("TEST 2 ERR:", e.response ? e.response.data : e.message);
  }

  console.log("\n=== TEST 3: DIFFERENT UPLOADED IMAGE ===");
  try {
    const form3 = new FormData();
    form3.append('command', 'Send a bona fide request letter to official.jaiwantkarrunworks@gmail.com');
    form3.append('inputType', 'text');
    const dummyBuffer3 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjDAGADc7BgQA7f2i5gAAAABJRU5ErkJggg==', 'base64');
    form3.append('image', dummyBuffer3, { filename: 'new_student_id.png', contentType: 'image/png' });

    const res3 = await axios.post('http://localhost:5000/api/automations', form3, {
      headers: { ...form3.getHeaders(), Authorization: 'Bearer ' + token }
    });
    console.log("TEST 3 STATUS:", res3.data.success ? 'SUCCESS' : 'FAILED', "ATTACHMENTS:", res3.data.data.attachments.length);
    const html3 = res3.data.data.generatedContent.htmlBody || '';
    console.log("TEST 3 CONTAINS BROKEN IMG TAGS?", html3.includes('<img'));
  } catch (e) {
    console.error("TEST 3 ERR:", e.response ? e.response.data : e.message);
  }
}

runTests();
