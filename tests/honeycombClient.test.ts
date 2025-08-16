/**
 * @file Tests for the Honeycomb client.
 */
import honeycombClient from '../src/lib/honeycombClient';

describe('HoneycombClient', () => {
  beforeAll(() => {
    // We would initialize the client here in a real test
    // honeycombClient.init(...);
  });

  it('should return a consistent shape for completeMission', async () => {
    const result = await honeycombClient.sendCharacterOnMission(
      'test-mission',
      'test-character'
    );
    expect(result).toHaveProperty('tx');
    expect(typeof result.tx).toBe('string');
  });
});