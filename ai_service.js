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

        const systemInstruction = `당신은 전문 C++ 개발자이자 컴파일러 엔지니어입니다.
제공된 C++ 소스 코드와 컴파일러/런타임 오류 로그를 분석하는 것이 당신의 임무입니다.

중요: 모든 응답과 설명을 한국어로 작성하세요.

1. 오류의 근본 원인을 파악하세요.
2. 원래 로직을 유지하면서 오류를 해결하는 코드를 수정하세요.
3. 다음 스키마로 엄격한 JSON 형식으로 결과를 반환하세요:
{
  "fixed_files": [ { "name": "filename.cpp", "content": "수정된 내용" } ],
  "explanation": "수정에 대한 간단한 한국어 설명"
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

