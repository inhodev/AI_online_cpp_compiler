const { GoogleGenAI } = require('@google/genai');
const apiKey = process.env.GEMINI_API_KEY || 'test_key'; // Ensure key is available or use mock if testing structure only (but need real key for real response)

// We need the real key to get a real response structure
require('dotenv').config();

async function run() {
    try {
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });
        console.log('Result keys:', Object.keys(result));
        console.log('Result:', JSON.stringify(result, null, 2));

        if (result.response) {
            console.log('Response keys:', Object.keys(result.response));
        }
    } catch (e) {
        console.error(e);
    }
}
run();
