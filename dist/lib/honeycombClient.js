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
const solana_1 = require("./solana");
const edge_client_1 = require("@honeycomb-protocol/edge-client");
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
    findUser(wallet) {
        return __awaiter(this, void 0, void 0, function* () {
            return solana_1.honeycombClient.findUsers({ wallets: [wallet] }).then(({ user }) => user[0]);
        });
    }
    findProfile(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return solana_1.honeycombClient.findProfiles({ userIds: [user.id], projects: [HONEYCOMB_PROJECT_ID] }).then(({ profile }) => profile[0]);
        });
    }
    findCharacter(userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findUser(userWallet);
            if (!user)
                return null;
            const profile = yield this.findProfile(user);
            if (!profile)
                return null;
            const characters = yield solana_1.honeycombClient.findCharacters({ wallets: [userWallet], trees: [HONEYCOMB_CHARACTER_MODEL_ID] });
            return characters.character[0];
        });
    }
    getOrCreateUserAndCharacter(userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield this.findUser(userWallet);
            if (!user) {
                const { createNewUserTransaction: txResponse } = yield solana_1.honeycombClient.createNewUserTransaction({
                    info: { name: userWallet, pfp: '', bio: '' },
                    wallet: userWallet,
                });
                // This tx needs to be signed by the user, which complicates a pure backend flow.
                // For now, we assume the user exists.
                throw new Error('User creation on-the-fly is not supported in this version. Please create user first.');
            }
            let character = yield this.findCharacter(userWallet);
            if (!character) {
                const { createAssembleCharacterTransaction: tx } = yield solana_1.honeycombClient.createAssembleCharacterTransaction({
                    project: HONEYCOMB_PROJECT_ID,
                    characterModel: HONEYCOMB_CHARACTER_MODEL_ID,
                    assemblerConfig: solana_1.authorityKeypair.publicKey.toString(),
                    owner: userWallet,
                    authority: solana_1.authorityKeypair.publicKey.toString(),
                    attributes: [],
                });
                // This tx also needs to be signed by the user.
                throw new Error('Character creation on-the-fly is not supported in this version. Please create character first.');
            }
            return { user, character };
        });
    }
    createMission(name, cost, minXp, rewards, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            const { createCreateMissionTransaction: { tx, missionAddress } } = yield solana_1.honeycombClient.createCreateMissionTransaction({
                data: {
                    name,
                    cost: { address: cost.resource_address, amount: cost.amount },
                    minXp,
                    rewards: rewards.map(r => (Object.assign(Object.assign({}, r), { kind: r.kind || edge_client_1.RewardKind.Xp }))),
                    project: HONEYCOMB_PROJECT_ID,
                    missionPool: HONEYCOMB_MISSION_POOL_ID,
                    authority: solana_1.authorityKeypair.publicKey.toString(),
                    payer: solana_1.authorityKeypair.publicKey.toString(),
                    duration
                },
            });
            // The tx needs to be signed and sent by the authority.
            // This should be handled by a secure backend service.
            const mission = yield solana_1.honeycombClient.findMissions({ addresses: [missionAddress] }).then(({ mission }) => mission[0]);
            return mission;
        });
    }
    sendCharacterOnMission(missionId, characterId, userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findUser(userWallet);
            if (!user)
                throw new Error('User not found');
            const { createSendCharactersOnMissionTransaction: { transactions } } = yield solana_1.honeycombClient.createSendCharactersOnMissionTransaction({
                data: {
                    mission: missionId,
                    characterAddresses: [characterId],
                    authority: userWallet,
                    userId: user.id,
                },
            });
            // These transactions need to be signed by the user.
            return transactions;
        });
    }
    recallCharacterFromMission(missionId, characterId, userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findUser(userWallet);
            if (!user)
                throw new Error('User not found');
            const { createRecallCharactersTransaction: { transactions } } = yield solana_1.honeycombClient.createRecallCharactersTransaction({
                data: {
                    mission: missionId,
                    characterAddresses: [characterId],
                    authority: userWallet,
                    userId: user.id,
                },
            });
            // These transactions need to be signed by the user.
            return transactions;
        });
    }
    getMissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const missions = yield solana_1.honeycombClient.findMissions({ missionPools: [HONEYCOMB_MISSION_POOL_ID] });
            return missions.mission;
        });
    }
    getMission(missionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const mission = yield solana_1.honeycombClient.findMissions({ addresses: [missionId] });
            if (!mission.mission.length) {
                throw new Error(`Mission with id ${missionId} not found`);
            }
            return mission.mission[0];
        });
    }
}
exports.default = new HoneycombClient();
