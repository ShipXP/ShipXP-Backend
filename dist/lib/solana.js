"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verxioClient = exports.honeycombClient = exports.umiSigner = exports.authorityKeypair = exports.umi = exports.connection = void 0;
const web3_js_1 = require("@solana/web3.js");
const edge_client_1 = __importDefault(require("@honeycomb-protocol/edge-client"));
const core_1 = require("@verxioprotocol/core");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const umi_1 = require("@metaplex-foundation/umi");
const bs58 = __importStar(require("bs58"));
// --- Solana Connection ---
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
exports.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
// --- UMI Setup ---
exports.umi = (0, umi_bundle_defaults_1.createUmi)(rpcUrl);
// --- Authorities and Signers ---
let secretKeyBase58;
if (process.env.PROGRAM_AUTHORITY_SECRET) {
    try {
        const secret = JSON.parse(process.env.PROGRAM_AUTHORITY_SECRET);
        secretKeyBase58 = bs58.encode(new Uint8Array(secret));
        console.log('Loaded program authority from environment.');
    }
    catch (error) {
        console.error('Failed to parse PROGRAM_AUTHORITY_SECRET from .env. Please ensure it is a valid JSON array of numbers.');
        process.exit(1);
    }
}
else {
    const generatedKeypair = web3_js_1.Keypair.generate();
    secretKeyBase58 = bs58.encode(generatedKeypair.secretKey);
    console.log('Generated new program authority. SAVE THIS SECRET KEY!');
    console.log('---');
    console.log('PROGRAM_AUTHORITY_SECRET=' + JSON.stringify(Array.from(generatedKeypair.secretKey)));
    console.log('---');
}
exports.authorityKeypair = web3_js_1.Keypair.fromSecretKey(bs58.decode(secretKeyBase58));
exports.umiSigner = exports.umi.eddsa.createKeypairFromSecretKey(bs58.decode(secretKeyBase58));
exports.umi.use((0, umi_1.keypairIdentity)(exports.umiSigner));
// --- Honeycomb Client ---
const honeycombApiUrl = process.env.HONEYCOMB_API_URL || 'https://edge.main.honeycombprotocol.com/';
exports.honeycombClient = (0, edge_client_1.default)(honeycombApiUrl, true);
// --- Verxio Client ---
exports.verxioClient = (0, core_1.initializeVerxio)(exports.umi, exports.umi.identity.publicKey);
console.log('Solana clients initialized.');
console.log('Program Authority Public Key:', exports.umi.identity.publicKey.toString());
