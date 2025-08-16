/**
 * @file Mock code evaluation service.
 */

interface EvaluationResult {
  testsPassed: boolean;
  output: string;
  error?: string;
}

class CodeEvaluator {
  /**
   * Mocks the evaluation of user-submitted code against test cases.
   * In a real system, this would involve a sandboxed environment.
   */
  async evaluate(code: string, testCases: { input: string; expectedOutput: string }[]): Promise<EvaluationResult> {
    console.log("Mock CodeEvaluator: Evaluating code...");
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple mock logic: assume tests pass if code contains 'return'
    const testsPassed = code.includes("return");
    const output = testsPassed ? "All tests passed." : "Some tests failed.";

    return {
      testsPassed,
      output,
    };
  }
}

export default new CodeEvaluator();
