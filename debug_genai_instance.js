const { GoogleGenAI } = require('@google/genai');
const apiKey = 'test_key';
try {
    const genAI = new GoogleGenAI({ apiKey });
    console.log('Instance keys:', Object.keys(genAI));
    console.log('Prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(genAI)));
} catch (e) {
    console.error(e);
}
