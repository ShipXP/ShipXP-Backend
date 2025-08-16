import { verxioClient, umi, umiSigner } from '../lib/solana';
import { createLoyaltyProgram } from '@verxioprotocol/core';

async function setupVerxio() {
  console.log('Starting Verxio setup...');
  console.log(`Using authority: ${umi.identity.publicKey.toString()}`);

  // 1. Create Loyalty Program
  console.log('\nStep 1: Creating Loyalty Program...');

  const programDetails = {
    loyaltyProgramName: 'ShipXP Rewards',
    programAuthority: umi.identity.publicKey,
    updateAuthority: umiSigner,
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
    const result = await createLoyaltyProgram(verxioClient, programDetails);

    console.log(`Loyalty Program created successfully!`);
    console.log(`Collection Address: ${result.collection.publicKey.toString()}`);
    console.log(`Transaction Signature: ${result.signature}`);

    console.log(`\n--- SAVE THIS VALUE --- `);
    console.log(`VERXIO_LOYALTY_PROGRAM_ID=${result.collection.publicKey.toString()}`);
    console.log(`-----------------------\n`);

    console.log('Verxio setup complete!');
    console.log('Please save the collection address logged above to your .env file.');

  } catch (error) {
    console.error('Error creating Verxio loyalty program:', error);
    process.exit(1);
  }
}

setupVerxio().catch(err => {
  console.error('Error during Verxio setup:', err);
  process.exit(1);
});