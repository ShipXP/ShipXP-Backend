import geminiClient from "./geminiClient";
import { initDb } from "./db"; // Import initDb to access Firestore

interface AIVerificationResult {
  aiApproved: boolean;
  reason?: string;
}

class AIVerifier {
  /**
   * Verifies code using the Gemini AI model, with mission context.
   * @param code The user's submitted code.
   * @param missionId The ID of the mission to get context from.
   * @param language The programming language of the mission.
   */
  async verify(code: string, missionId: string, language: string): Promise<AIVerificationResult> {
    console.log("AIVerifier: Sending code to Gemini for verification, with mission context...");
    try {
      const db = initDb();
      const missionDoc = await db.collection('missions').doc(missionId).get();

      if (!missionDoc.exists) {
        throw new Error(`Mission with ID ${missionId} not found for AI verification.`);
      }
      const missionData = missionDoc.data() as any; // Cast to any

      const missionDescription = missionData.description || '';
      const testCases = missionData.testCases || [];

      const aiApproved = await geminiClient.verifyCode(code, missionDescription, testCases, language);
      const reason = aiApproved ? "Code meets AI quality standards." : "AI did not approve the code.";
      return {
        aiApproved,
        reason,
      };
    } catch (error: any) {
      console.error("Error during AI verification:", error);
      return {
        aiApproved: false,
        reason: `AI verification failed: ${error.message || "Unknown error"}`,
      };
    }
  }
}

export default new AIVerifier();