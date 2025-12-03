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

        // 토큰 사용량 최적화를 위해 간단한 시스템 프롬프트 사용
        const systemInstruction = `C++ 컴파일 에러를 분석하고 수정하세요. JSON 형식으로 응답: {"fixed_files": [{"name": "file.cpp", "content": "fixed code"}], "explanation": "설명"}`;

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

