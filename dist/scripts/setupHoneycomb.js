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
const solana_1 = require("../lib/solana");
const web3_js_1 = require("@solana/web3.js");
const edge_client_1 = require("@honeycomb-protocol/edge-client");
// A simple utility to send a transaction
function sendTx(tx, signers, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = web3_js_1.Transaction.from(Buffer.from(tx.transaction, 'base64'));
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(solana_1.connection, transaction, signers);
        console.log(`Transaction [${name}] sent with signature: ${signature}`);
        return signature;
    });
}
function setupHoneycomb() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Honeycomb setup...');
        console.log(`Using authority: ${solana_1.authorityKeypair.publicKey.toBase58()}`);
        // 1. Create Project
        console.log('\nStep 1: Creating Project...');
        const { createCreateProjectTransaction: { tx: createProjectTx, project: projectAddress, }, } = yield solana_1.honeycombClient.createCreateProjectTransaction({
            name: 'ShipXP',
            authority: solana_1.authorityKeypair.publicKey.toString(),
            payer: solana_1.authorityKeypair.publicKey.toString(),
        });
        yield sendTx(createProjectTx, [solana_1.authorityKeypair], 'Create Project');
        console.log(`Project created with address: ${projectAddress}`);
        // Save the project address to a config file or .env for later use
        // For now, we'll just log it.
        console.log(`\n--- SAVE THESE VALUES --- `);
        console.log(`HONEYCOMB_PROJECT_ID=${projectAddress}`);
        console.log(`-----------------------\n`);
        // 2. Create XP Resource
        console.log('Step 2: Creating XP Resource...');
        const { createCreateNewResourceTransaction: { tx: createResourceTx, resource: resourceAddress, }, } = yield solana_1.honeycombClient.createCreateNewResourceTransaction({
            project: projectAddress,
            authority: solana_1.authorityKeypair.publicKey.toString(),
            payer: solana_1.authorityKeypair.publicKey.toString(),
            params: {
                name: 'Experience Points',
                symbol: 'XP',
                decimals: 0,
                uri: 'https://shipexperience.com/xp-metadata.json', // Placeholder URI
                storage: edge_client_1.ResourceStorageEnum.AccountState, // On-chain, non-compressed
            },
        });
        yield sendTx(createResourceTx, [solana_1.authorityKeypair], 'Create XP Resource');
        console.log(`XP Resource created with address: ${resourceAddress}`);
        console.log(`\n--- SAVE THESE VALUES --- `);
        console.log(`HONEYCOMB_XP_RESOURCE_ID=${resourceAddress}`);
        console.log(`-----------------------\n`);
        // 3. Create Character Model
        console.log('Step 3: Creating Character Model...');
        const { createCreateCharacterModelTransaction: { tx: createCharacterModelTx, characterModel: characterModelAddress, }, } = yield solana_1.honeycombClient.createCreateCharacterModelTransaction({
            project: projectAddress,
            authority: solana_1.authorityKeypair.publicKey.toString(),
            payer: solana_1.authorityKeypair.publicKey.toString(),
            config: {
                kind: 'Assembled', // Native Honeycomb characters, no external NFT needed
                assemblerConfigInput: {
                    assemblerConfig: solana_1.authorityKeypair.publicKey.toString(), // Using authority as a placeholder
                    collectionName: 'ShipXP Crew',
                    name: 'ShipXP Crew Member',
                    symbol: 'CREW',
                    description: 'A member of the ShipXP crew.',
                    sellerFeeBasisPoints: 0,
                    creators: [
                        {
                            address: solana_1.authorityKeypair.publicKey.toString(),
                            share: 100,
                        },
                    ],
                },
            },
        });
        yield sendTx(createCharacterModelTx, [solana_1.authorityKeypair], 'Create Character Model');
        console.log(`Character Model created with address: ${characterModelAddress}`);
        console.log(`\n--- SAVE THESE VALUES --- `);
        console.log(`HONEYCOMB_CHARACTER_MODEL_ID=${characterModelAddress}`);
        console.log(`-----------------------\n`);
        // 4. Create Mission Pool
        console.log('Step 4: Creating Mission Pool...');
        const { createCreateMissionPoolTransaction: { tx: createMissionPoolTx, missionPoolAddress, }, } = yield solana_1.honeycombClient.createCreateMissionPoolTransaction({
            data: {
                name: 'ShipXP Quests',
                project: projectAddress,
                characterModel: characterModelAddress,
                authority: solana_1.authorityKeypair.publicKey.toString(),
                payer: solana_1.authorityKeypair.publicKey.toString(),
            },
        });
        yield sendTx(createMissionPoolTx, [solana_1.authorityKeypair], 'Create Mission Pool');
        console.log(`Mission Pool created with address: ${missionPoolAddress}`);
        console.log(`\n--- SAVE THESE VALUES --- `);
        console.log(`HONEYCOMB_MISSION_POOL_ID=${missionPoolAddress}`);
        console.log(`-----------------------\n`);
        console.log('Honeycomb setup complete!');
        console.log('Please save the addresses logged above to your .env file.');
    });
}
setupHoneycomb().catch(err => {
    console.error('Error during Honeycomb setup:', err);
    process.exit(1);
});
