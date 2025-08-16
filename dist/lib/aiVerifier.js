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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const geminiClient_1 = __importDefault(require("./geminiClient"));
const db_1 = require("./db"); // Import initDb to access Firestore
class AIVerifier {
    /**
     * Verifies code using the Gemini AI model, with mission context.
     * @param code The user's submitted code.
     * @param missionId The ID of the mission to get context from.
     * @param language The programming language of the mission.
     */
    verify(code, missionId, language) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("AIVerifier: Sending code to Gemini for verification, with mission context...");
            try {
                const db = (0, db_1.initDb)();
                const missionDoc = yield db.collection('missions').doc(missionId).get();
                if (!missionDoc.exists) {
                    throw new Error(`Mission with ID ${missionId} not found for AI verification.`);
                }
                const missionData = missionDoc.data(); // Cast to any
                const missionDescription = missionData.description || '';
                const testCases = missionData.testCases || [];
                const aiApproved = yield geminiClient_1.default.verifyCode(code, missionDescription, testCases, language);
                const reason = aiApproved ? "Code meets AI quality standards." : "AI did not approve the code.";
                return {
                    aiApproved,
                    reason,
                };
            }
            catch (error) {
                console.error("Error during AI verification:", error);
                return {
                    aiApproved: false,
                    reason: `AI verification failed: ${error.message || "Unknown error"}`,
                };
            }
        });
    }
}
exports.default = new AIVerifier();
