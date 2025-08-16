"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
class GeminiClient {
    constructor() {
        this.genAI = null;
        this.useMock = process.env.USE_MOCK_GEMINI === 'true';
        if (this.useMock) {
            console.log("GeminiClient: Operating in MOCK mode.");
            return;
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable not set.");
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.generationModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        this.chatModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
    /**
     * Generates a new mission using the Gemini API.
     */
    generateMission(difficulty, language) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.useMock) {
                console.log(`GeminiClient: MOCK generating ${difficulty} ${language} mission.`);
                return {
                    title: `Mock Mission: ${difficulty} ${language} Challenge`,
                    description: `This is a mock mission for ${language} at ${difficulty} difficulty.`,
                    difficulty,
                    xpReward: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 150 : 300,
                    timeLimit: difficulty === 'Easy' ? 180 : difficulty === 'Medium' ? 300 : 480,
                    testCases: [
                        { input: "'mock input'", expectedOutput: "'mock output'" },
                    ],
                    language,
                };
            }
            console.log(`GeminiClient: Generating ${difficulty} ${language} mission with real Gemini API...`);
            const prompt = `Generate a coding mission for a developer in ${language}. The mission should be ${difficulty} difficulty. Include a title, description, xpReward (number, appropriate for difficulty, higher for shorter time limits), timeLimit in seconds (between 110 and 240), and an array of 2-3 test cases with 'input' and 'expectedOutput' strings. The 'language' field in the JSON output must be '${language}'. The mission should be solvable with a simple function. Output only a JSON object. Ensure the JSON is valid and directly parseable. Example: { "title": "Reverse String", "description": "Write a function that reverses a given string.", "difficulty": "Easy", "xpReward": 100, "timeLimit": 180, "testCases": [{"input": "'hello'", "expectedOutput": "'olleh'"}, {"input": "'world'", "expectedOutput": "'dlrow'"}], "language": "javascript" }`;
            try {
                const result = yield this.generationModel.generateContent(prompt);
                const responseText = result.response.text();
                console.log("Gemini Mission Generation Raw Response:", responseText);
                // Attempt to parse JSON, handle cases where Gemini might include extra text
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
                let jsonString = responseText;
                if (jsonMatch && jsonMatch[1]) {
                    jsonString = jsonMatch[1];
                }
                const mission = JSON.parse(jsonString);
                // Basic validation to ensure required fields are present
                if (!mission.title || !mission.description || !mission.xpReward || !mission.timeLimit || !mission.testCases || !mission.language) {
                    throw new Error("Generated mission is missing required fields.");
                }
                return mission;
            }
            catch (error) {
                console.error("Error generating mission with Gemini:", error.message || error);
                if (error.response && error.response.candidates) {
                    console.error("Gemini API candidates:", JSON.stringify(error.response.candidates, null, 2));
                }
                if (error.response && error.response.promptFeedback) {
                    console.error("Gemini API prompt feedback:", JSON.stringify(error.response.promptFeedback, null, 2));
                }
                // Fallback to a hardcoded mock mission on error
                return {
                    title: `Fallback Mission: ${difficulty} Challenge`,
                    description: `Failed to generate mission from AI. This is a fallback mission.`,
                    difficulty,
                    xpReward: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 150 : 300,
                    timeLimit: difficulty === 'Easy' ? 180 : difficulty === 'Medium' ? 300 : 480,
                    testCases: [
                        { input: "'fallback'", expectedOutput: "'kcabllaf'" },
                    ],
                    language: language, // Default language for fallback
                };
            }
        });
    }
    /**
     * Verifies code using the Gemini API, with mission context.
     * Returns true if AI approves, false otherwise.
     */
    verifyCode(code, missionDescription, testCases, language) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.useMock) {
                console.log("GeminiClient: MOCK verifying code.");
                // In mock mode, always approve code for simplicity
                return true;
            }
            console.log("GeminiClient: Verifying code with real Gemini API, with context...");
            const testCasesString = testCases.map(tc => `Input: ${tc.input}, Expected Output: ${tc.expectedOutput}`).join('\n');
            const prompt = `Review the following ${language} code submission for a coding challenge.\n\nMission Description: ${missionDescription}\n\nTest Cases:\n${testCasesString}\n\nUser Submitted Code:\n` + "```" + language + "\n" + code + "\n```\n\nBased on the mission description and test cases, does the submitted code provide a correct, readable, and reasonably efficient solution? Answer only with 'True' or 'False'.";
            try {
                const chat = this.chatModel.startChat({
                    history: [],
                });
                const result = yield chat.sendMessage(prompt);
                const responseText = result.response.text().trim().toLowerCase();
                console.log("Gemini Code Verification Raw Response:", responseText);
                return responseText === 'true';
            }
            catch (error) {
                console.error("Error verifying code with Gemini:", error);
                return false; // Default to false on error
            }
        });
    }
}
exports.default = new GeminiClient();
