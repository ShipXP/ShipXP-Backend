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
const core_1 = require("@verxioprotocol/core");
function setupVerxio() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Verxio setup...');
        console.log(`Using authority: ${solana_1.umi.identity.publicKey.toString()}`);
        // 1. Create Loyalty Program
        console.log('\nStep 1: Creating Loyalty Program...');
        const programDetails = {
            loyaltyProgramName: 'ShipXP Rewards',
            programAuthority: solana_1.umi.identity.publicKey,
            updateAuthority: solana_1.umiSigner,
            metadata: {
                organizationName: 'ShipXP',
                brandColor: '#FFFFFF',
            },
            tiers: [
                { name: 'Grind', xpRequired: 0, rewards: ['Base Level'] },
                { name: 'Bronze', xpRequired: 500, rewards: ['Level 1'] },
                { name: 'Silver', xpRequired: 1000, rewards: ['Level 2'] },
                { name: 'Gold', xpRequired: 2000, rewards: ['Level 3'] },
            ],
            pointsPerAction: {
                shipquest_success: 100, // Placeholder, can be updated later
            },
        };
        try {
            const result = yield (0, core_1.createLoyaltyProgram)(solana_1.verxioClient, programDetails);
            console.log(`Loyalty Program created successfully!`);
            console.log(`Collection Address: ${result.collection.publicKey.toString()}`);
            console.log(`Transaction Signature: ${result.signature}`);
            console.log(`\n--- SAVE THIS VALUE --- `);
            console.log(`VERXIO_LOYALTY_PROGRAM_ID=${result.collection.publicKey.toString()}`);
            console.log(`-----------------------\n`);
            console.log('Verxio setup complete!');
            console.log('Please save the collection address logged above to your .env file.');
        }
        catch (error) {
            console.error('Error creating Verxio loyalty program:', error);
            process.exit(1);
        }
    });
}
setupVerxio().catch(err => {
    console.error('Error during Verxio setup:', err);
    process.exit(1);
});
