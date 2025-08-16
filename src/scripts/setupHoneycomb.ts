

import { honeycombClient, authorityKeypair, connection } from '../lib/solana';
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js';
import { ResourceStorageEnum, RewardKind } from '@honeycomb-protocol/edge-client';

// A simple utility to send a transaction
async function sendTx(tx: any, signers: any[], name: string) {
  const transaction = Transaction.from(Buffer.from(tx.transaction, 'base64'));
  const signature = await sendAndConfirmTransaction(connection, transaction, signers);
  console.log(`Transaction [${name}] sent with signature: ${signature}`);
  return signature;
}

async function setupHoneycomb() {
  console.log('Starting Honeycomb setup...');
  console.log(`Using authority: ${authorityKeypair.publicKey.toBase58()}`);

  // 1. Create Project
  console.log('\nStep 1: Creating Project...');
  const {
    createCreateProjectTransaction: {
      tx: createProjectTx,
      project: projectAddress,
    },
  } = await honeycombClient.createCreateProjectTransaction({
    name: 'ShipXP',
    authority: authorityKeypair.publicKey.toString(),
    payer: authorityKeypair.publicKey.toString(),
  });

  await sendTx(createProjectTx, [authorityKeypair], 'Create Project');
  console.log(`Project created with address: ${projectAddress}`);

  // Save the project address to a config file or .env for later use
  // For now, we'll just log it.
  console.log(`\n--- SAVE THESE VALUES --- `);
  console.log(`HONEYCOMB_PROJECT_ID=${projectAddress}`);
  console.log(`-----------------------\n`);

  // 2. Create XP Resource
  console.log('Step 2: Creating XP Resource...');
  const {
    createCreateNewResourceTransaction: {
      tx: createResourceTx,
      resource: resourceAddress,
    },
  } = await honeycombClient.createCreateNewResourceTransaction({
    project: projectAddress,
    authority: authorityKeypair.publicKey.toString(),
    payer: authorityKeypair.publicKey.toString(),
    params: {
      name: 'Experience Points',
      symbol: 'XP',
      decimals: 0,
      uri: 'https://shipexperience.com/xp-metadata.json', // Placeholder URI
      storage: ResourceStorageEnum.AccountState, // On-chain, non-compressed
    },
  });

  await sendTx(createResourceTx, [authorityKeypair], 'Create XP Resource');
  console.log(`XP Resource created with address: ${resourceAddress}`);
  console.log(`\n--- SAVE THESE VALUES --- `);
  console.log(`HONEYCOMB_XP_RESOURCE_ID=${resourceAddress}`);
  console.log(`-----------------------\n`);

  // 3. Create Character Model
  console.log('Step 3: Creating Character Model...');
  const {
    createCreateCharacterModelTransaction: {
      tx: createCharacterModelTx,
      characterModel: characterModelAddress,
    },
  } = await honeycombClient.createCreateCharacterModelTransaction({
    project: projectAddress,
    authority: authorityKeypair.publicKey.toString(),
    payer: authorityKeypair.publicKey.toString(),
    config: {
      kind: 'Assembled', // Native Honeycomb characters, no external NFT needed
      assemblerConfigInput: {
        assemblerConfig: authorityKeypair.publicKey.toString(), // Using authority as a placeholder
        collectionName: 'ShipXP Crew',
        name: 'ShipXP Crew Member',
        symbol: 'CREW',
        description: 'A member of the ShipXP crew.',
        sellerFeeBasisPoints: 0,
        creators: [
          {
            address: authorityKeypair.publicKey.toString(),
            share: 100,
          },
        ],
      },
    },
  });

  await sendTx(createCharacterModelTx, [authorityKeypair], 'Create Character Model');
  console.log(`Character Model created with address: ${characterModelAddress}`);
  console.log(`\n--- SAVE THESE VALUES --- `);
  console.log(`HONEYCOMB_CHARACTER_MODEL_ID=${characterModelAddress}`);
  console.log(`-----------------------\n`);

  // 4. Create Mission Pool
  console.log('Step 4: Creating Mission Pool...');
  const {
    createCreateMissionPoolTransaction: {
      tx: createMissionPoolTx,
      missionPoolAddress,
    },
  } = await honeycombClient.createCreateMissionPoolTransaction({
    data: {
      name: 'ShipXP Quests',
      project: projectAddress,
      characterModel: characterModelAddress,
      authority: authorityKeypair.publicKey.toString(),
      payer: authorityKeypair.publicKey.toString(),
    },
  });

  await sendTx(createMissionPoolTx, [authorityKeypair], 'Create Mission Pool');
  console.log(`Mission Pool created with address: ${missionPoolAddress}`);
  console.log(`\n--- SAVE THESE VALUES --- `);
  console.log(`HONEYCOMB_MISSION_POOL_ID=${missionPoolAddress}`);
  console.log(`-----------------------\n`);

  console.log('Honeycomb setup complete!');
  console.log('Please save the addresses logged above to your .env file.');
}

setupHoneycomb().catch(err => {
  console.error('Error during Honeycomb setup:', err);
  process.exit(1);
});
