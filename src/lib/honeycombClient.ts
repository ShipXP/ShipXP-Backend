import { honeycombClient, authorityKeypair, connection } from './solana';
import { Mission, Reward, MissionCost, RewardKind } from '@honeycomb-protocol/edge-client';


const HONEYCOMB_PROJECT_ID = process.env.HONEYCOMB_PROJECT_ID;
const HONEYCOMB_CHARACTER_MODEL_ID = process.env.HONEYCOMB_CHARACTER_MODEL_ID;
const HONEYCOMB_MISSION_POOL_ID = process.env.HONEYCOMB_MISSION_POOL_ID;
const HONEYCOMB_XP_RESOURCE_ID = process.env.HONEYCOMB_XP_RESOURCE_ID;

class HoneycombClient {

  constructor() {
    if (!HONEYCOMB_PROJECT_ID || !HONEYCOMB_CHARACTER_MODEL_ID || !HONEYCOMB_MISSION_POOL_ID || !HONEYCOMB_XP_RESOURCE_ID) {
      throw new Error('Missing Honeycomb environment variables');
    }
  }

  private async findUser(wallet: string) {
    return honeycombClient.findUsers({ wallets: [wallet] }).then(({ user }) => user[0]);
  }

  private async findProfile(user: any) {
    return honeycombClient.findProfiles({ userIds: [user.id], projects: [HONEYCOMB_PROJECT_ID!] }).then(({ profile }) => profile[0]);
  }

  public async findCharacter(userWallet: string) {
    const user = await this.findUser(userWallet);
    if (!user) return null;

    const profile = await this.findProfile(user);
    if (!profile) return null;

    const characters = await honeycombClient.findCharacters({ wallets: [userWallet], trees: [HONEYCOMB_CHARACTER_MODEL_ID!] });
    return characters.character[0];
  }

  public async getOrCreateUserAndCharacter(userWallet: string) {
    let user = await this.findUser(userWallet);
    if (!user) {
      const { createNewUserTransaction: txResponse } = await honeycombClient.createNewUserTransaction({
        info: { name: userWallet, pfp: '', bio: '' },
        wallet: userWallet,
      });
      // This tx needs to be signed by the user, which complicates a pure backend flow.
      // For now, we assume the user exists.
      throw new Error('User creation on-the-fly is not supported in this version. Please create user first.');
    }

    let character = await this.findCharacter(userWallet);
    if (!character) {
        const { createAssembleCharacterTransaction: tx } = await honeycombClient.createAssembleCharacterTransaction({
            project: HONEYCOMB_PROJECT_ID!,
            characterModel: HONEYCOMB_CHARACTER_MODEL_ID!,
            assemblerConfig: authorityKeypair.publicKey.toString(),
            owner: userWallet,
            authority: authorityKeypair.publicKey.toString(),
            attributes: [],
        });
        // This tx also needs to be signed by the user.
        throw new Error('Character creation on-the-fly is not supported in this version. Please create character first.');
    }

    return { user, character };
  }

  public async createMission(name: string, cost: MissionCost, minXp: string, rewards: (Reward & { kind: RewardKind })[], duration: string): Promise<Mission> {
    const { createCreateMissionTransaction: { tx, missionAddress } } = await honeycombClient.createCreateMissionTransaction({
      data: {
        name,
        cost: { address: cost.resource_address, amount: cost.amount },
        minXp,
        rewards: rewards.map(r => ({...r, kind: r.kind || RewardKind.Xp})),
        project: HONEYCOMB_PROJECT_ID!,
        missionPool: HONEYCOMB_MISSION_POOL_ID!,
        authority: authorityKeypair.publicKey.toString(),
        payer: authorityKeypair.publicKey.toString(),
        duration
      },
    });

    // The tx needs to be signed and sent by the authority.
    // This should be handled by a secure backend service.

    const mission = await honeycombClient.findMissions({ addresses: [missionAddress] }).then(({ mission }) => mission[0]);
    return mission;
  }

  public async sendCharacterOnMission(missionId: string, characterId: string, userWallet: string) {
    const user = await this.findUser(userWallet);
    if (!user) throw new Error('User not found');

    const { createSendCharactersOnMissionTransaction: { transactions } } = await honeycombClient.createSendCharactersOnMissionTransaction({
      data: {
        mission: missionId,
        characterAddresses: [characterId],
        authority: userWallet,
        userId: user.id,
      },
    });

    // These transactions need to be signed by the user.
    return transactions;
  }

  public async recallCharacterFromMission(missionId: string, characterId: string, userWallet: string) {
    const user = await this.findUser(userWallet);
    if (!user) throw new Error('User not found');

    const { createRecallCharactersTransaction: { transactions } } = await honeycombClient.createRecallCharactersTransaction({
      data: {
        mission: missionId,
        characterAddresses: [characterId],
        authority: userWallet,
        userId: user.id,
      },
    });

    // These transactions need to be signed by the user.
    return transactions;
  }

  public async getMissions(): Promise<Mission[]> {
    const missions = await honeycombClient.findMissions({ missionPools: [HONEYCOMB_MISSION_POOL_ID!] });
    return missions.mission;
  }

  public async getMission(missionId: string): Promise<Mission> {
    const mission = await honeycombClient.findMissions({ addresses: [missionId] });
    if (!mission.mission.length) {
      throw new Error(`Mission with id ${missionId} not found`);
    }
    return mission.mission[0];
  }
}

export default new HoneycombClient();
