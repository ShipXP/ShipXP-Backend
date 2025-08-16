
import { Umi } from '@metaplex-foundation/umi';

interface UserTier {
  name: string;
  xpRequired: number;
  rewards: string[];
}

class VerxioMockClient {
  private context: any; // Mock context

  constructor() {
    console.log("VerxioMockClient initialized.");
  }

  init(umi: Umi, programAuthority: string) {
    this.context = { umi, programAuthority };
    console.log("Mock Verxio client initialized.");
  }

  public async issuePassIfNeeded(userWallet: string) {
    console.log(`Mock: Issuing pass for ${userWallet}`);
    return { pass: `mock-pass-${userWallet}`, currentTier: { name: "Bronze", xpRequired: 0, rewards: [] } };
  }

  public async awardPoints(userWallet: string, points: number, reason: string) {
    console.log(`Mock: Awarding ${points} points to ${userWallet} for ${reason}`);
    return { verxioTxId: `mock-tx-${Math.random().toString(36).substring(7)}`, awardedAt: Date.now() };
  }

  public async revokePoints(userWallet: string, points: number) {
    console.log(`Mock: Revoking ${points} points from ${userWallet}`);
    return { verxioTxId: `mock-tx-${Math.random().toString(36).substring(7)}`, revokedAt: Date.now() };
  }

  public async getUserTier(userWallet: string): Promise<UserTier | null> {
    console.log(`Mock: Getting tier for ${userWallet}`);
    return { name: "MockTier", xpRequired: 100, rewards: ["Mock Reward"] };
  }
}

export default new VerxioMockClient();
