require('dotenv').config({ path: '.env' });
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function test() {
  try {
    const response = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'user', content: 'Say hello in JSON' }
      ],
      max_tokens: 800,
    });
    console.log("SUCCESS:", response);
  } catch (error) {
    console.error("HF ERROR:");
    
    if (error.httpResponse && error.httpResponse.body) {
      console.error(JSON.stringify(error.httpResponse.body, null, 2));
    } else {
      console.error(error);
    }
  }
}

test();
