const { GoogleGenAI } = require('@google/genai');
const apiKey = 'test_key';
const genAI = new GoogleGenAI({ apiKey });
console.log('genAI.models keys:', Object.keys(genAI.models));
console.log('genAI.models prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(genAI.models)));
