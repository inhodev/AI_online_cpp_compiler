const { GoogleGenAI } = require("@google/genai");

/**
 * AI Service using Gemini API to analyze and fix C++ code.
 * @param {Array<{name: string, content: string}>} files - List of source files.
 * @param {string} errorLog - The error message from the compiler or runtime.
 * @returns {Promise<{fixed_files: Array, explanation: string}>}
 */
async function analyzeAndFixCode(files, errorLog) {
    console.log('[AI Service] Analyzing error with Gemini API...');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[AI Service] Error: GEMINI_API_KEY is not set.');
        return {
            fixed_files: files,
            explanation: "AI service is unavailable (Missing API Key). Returning original files."
        };
    }

    try {
        const genAI = new GoogleGenAI({ apiKey });

        const systemInstruction = `You are an expert C++ Developer and Compiler Engineer.
Your task is to analyze the provided C++ source code and the corresponding compiler/runtime error log.
1. Identify the root cause of the error.
2. Fix the code to resolve the error while preserving the original logic.
3. Return the result in strict JSON format with the following schema:
{
  "fixed_files": [ { "name": "filename.cpp", "content": "fixed content" } ],
  "explanation": "Brief explanation of the fix"
}`;

        const userPrompt = JSON.stringify({
            files: files,
            error_log: errorLog
        });

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: [{ text: systemInstruction + "\n\nInput Data:\n" + userPrompt }] }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) {
            throw new Error("No text in response");
        }
        const aiResponse = JSON.parse(responseText);

        return {
            fixed_files: aiResponse.fixed_files || files,
            explanation: aiResponse.explanation || "AI fixed the code."
        };

    } catch (error) {
        console.error('[AI Service] Gemini API Error:', error);
        return {
            fixed_files: files,
            explanation: `AI analysis failed: ${error.message}. Returning original files.`
        };
    }
}

module.exports = { analyzeAndFixCode };

