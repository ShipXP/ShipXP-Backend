
import { Mission, Reward, MissionCost, RewardKind } from '@honeycomb-protocol/edge-client';

class HoneycombMockClient {

  constructor() {
    console.log("HoneycombMockClient initialized.");
  }

  public async findUser(wallet: string) {
    console.log(`Mock: Finding user ${wallet}`);
    return { id: `mock-user-${wallet}`, wallet };
  }

  public async findProfile(user: any) {
    console.log(`Mock: Finding profile for user ${user.id}`);
    return { address: `mock-profile-${user.id}`, userId: user.id };
  }

  public async findCharacter(userWallet: string) {
    console.log(`Mock: Finding character for user ${userWallet}`);
    return { address: `mock-character-${userWallet}`, owner: userWallet };
  }

  public async getOrCreateUserAndCharacter(userWallet: string) {
    console.log(`Mock: Getting or creating user and character for ${userWallet}`);
    const user = await this.findUser(userWallet);
    const character = await this.findCharacter(userWallet);
    return { user, character };
  }

  public async createMission(name: string, cost: MissionCost, minXp: string, rewards: (Reward & { kind: RewardKind })[], duration: string): Promise<Mission> {
    console.log(`Mock: Creating mission ${name}`);
    return {
      address: `mock-mission-${Math.random().toString(36).substring(7)}`,
      name,
      missionPool: "mock-pool",
      cost: { resource_address: cost.resource_address, amount: cost.amount },
      minXp,
      rewards,
      duration,
      bump: 1,
      discriminator: "mock",
      program_id: "mock",
      project: "mock",
      requirement: { kind: "All", requirements: [] },
    };
  }

  public async sendCharacterOnMission(missionId: string, characterId: string, userWallet: string) {
    console.log(`Mock: Sending character ${characterId} on mission ${missionId} for ${userWallet}`);
    return [`mock-tx-${Math.random().toString(36).substring(7)}`];
  }

  public async recallCharacterFromMission(missionId: string, characterId: string, userWallet: string) {
    console.log(`Mock: Recalling character ${characterId} from mission ${missionId} for ${userWallet}`);
    return [`mock-tx-${Math.random().toString(36).substring(7)}`];
  }

  public async getMissions(): Promise<Mission[]> {
    console.log("Mock: Getting all missions");
    return [
      {
        address: "mock-mission-1",
        name: "Mock Mission 1",
        missionPool: "mock-pool",
        cost: { resource_address: "mock-resource-xp", amount: "100" },
        minXp: "0",
        rewards: [{ kind: RewardKind.Xp, max: "100", min: "100" }],
        duration: "3600",
        bump: 1,
        discriminator: "mock",
        program_id: "mock",
        project: "mock",
        requirement: { kind: "All", requirements: [] },
      },
    ];
  }

  public async getMission(missionId: string): Promise<Mission> {
    console.log(`Mock: Getting mission ${missionId}`);
    const missions = await this.getMissions();
    const mission = missions.find(m => m.address === missionId);
    if (!mission) throw new Error(`Mock Mission ${missionId} not found`);
    return mission;
  }
}

export default new HoneycombMockClient();
