import { Connection, Keypair } from '@solana/web3.js';
import createEdgeClient from '@honeycomb-protocol/edge-client';
import { initializeVerxio } from '@verxioprotocol/core';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, Umi, KeypairSigner } from '@metaplex-foundation/umi';
import * as bs58 from 'bs58';

import HoneycombRealClient from './honeycombClient';
import HoneycombMockClient from './honeycombMockClient';
import VerxioRealClient from './verxioClient';
import VerxioMockClient from './verxioMockClient';

// --- Solana Connection ---
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const connection = new Connection(rpcUrl, 'confirmed');

// --- UMI Setup ---
export const umi: Umi = createUmi(rpcUrl);

// --- Authorities and Signers ---
let secretKeyBase58: string;
if (process.env.PROGRAM_AUTHORITY_SECRET) {
  try {
    const secret = JSON.parse(process.env.PROGRAM_AUTHORITY_SECRET) as number[];
    secretKeyBase58 = bs58.encode(new Uint8Array(secret));
    console.log('Loaded program authority from environment.');
  } catch (error) {
    console.error('Failed to parse PROGRAM_AUTHORITY_SECRET from .env. Please ensure it is a valid JSON array of numbers.');
    process.exit(1);
  }
} else {
  const generatedKeypair = Keypair.generate();
  secretKeyBase58 = bs58.encode(generatedKeypair.secretKey);
  console.log('Generated new program authority. SAVE THIS SECRET KEY!');
  console.log('---');
  console.log('PROGRAM_AUTHORITY_SECRET=' + JSON.stringify(Array.from(generatedKeypair.secretKey)));
  console.log('---');
}

export const authorityKeypair = Keypair.fromSecretKey(bs58.decode(secretKeyBase58));
export const umiSigner: KeypairSigner = umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKeyBase58));
umi.use(keypairIdentity(umiSigner));


// --- Honeycomb Client ---
const honeycombApiUrl = process.env.HONEYCOMB_API_URL || 'https://edge.main.honeycombprotocol.com/';

let honeycombClientInstance: HoneycombRealClient | HoneycombMockClient;
if (process.env.APPLICATION_STATE === 'MOCK') {
  honeycombClientInstance = new HoneycombMockClient();
} else {
  honeycombClientInstance = new HoneycombRealClient();
}
export const honeycombClient = honeycombClientInstance;


// --- Verxio Client ---
let verxioClientInstance: VerxioRealClient | VerxioMockClient;
if (process.env.APPLICATION_STATE === 'MOCK') {
  verxioClientInstance = new VerxioMockClient();
} else {
  verxioClientInstance = new VerxioRealClient();
}
export const verxioClient = verxioClientInstance;

console.log('Solana clients initialized.');
console.log('Program Authority Public Key:', umi.identity.publicKey.toString());