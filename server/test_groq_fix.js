require('dotenv').config();
const axios = require('axios');

async function testWithHighTokens() {
  const systemPrompt = `You are the content-generation engine for CommandFlow AI. The user's command is the source of truth. Return valid JSON only with keys: intent, channel, recipients, subject, message.`;
  const userCommand = 'send a leave letter to jksam37@gmail.com as i am suffering from fever for my class mentor in about 500 words ';

  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  for (const model of models) {
    try {
      console.log('Testing', model, '...');
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ userCommand }) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 4096
      }, {
        headers: {
          Authorization: 'Bearer ' + process.env.GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      });

      console.log(model, 'RAW CONTENT:', res.data.choices[0].message.content.substring(0, 300));
      const data = JSON.parse(res.data.choices[0].message.content);
      console.log(model, 'SUCCESS!');
      console.log('Keys:', Object.keys(data));
      console.log('Subject:', data.subject);
      console.log('Recipients:', data.recipients || data.recipient);
      const text = data.message || data.letter || data.body || '';
      console.log('Message length (words):', text.split(/\s+/).length);
      return;
    } catch (err) {
      console.log(model, 'FAIL:', err.response ? err.response.status + ' ' + JSON.stringify(err.response.data) : err.message);
    }
  }
}

testWithHighTokens();
