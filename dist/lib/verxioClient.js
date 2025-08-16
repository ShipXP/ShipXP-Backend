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
const core_1 = require("@verxioprotocol/core");
const umi_1 = require("@metaplex-foundation/umi");
const VERXIO_LOYALTY_PROGRAM_ID = process.env.VERXIO_LOYALTY_PROGRAM_ID;
class VerxioClient {
    constructor() {
        if (!VERXIO_LOYALTY_PROGRAM_ID) {
            throw new Error('Missing Verxio environment variables');
        }
    }
    getPass(userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const assetData = yield (0, core_1.getAssetData)(solana_1.verxioClient, (0, umi_1.publicKey)(userWallet));
                return assetData;
            }
            catch (e) {
                return null;
            }
        });
    }
    issuePassIfNeeded(userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            let pass = yield this.getPass(userWallet);
            if (!pass) {
                const result = yield (0, core_1.issueLoyaltyPass)(solana_1.verxioClient, {
                    collectionAddress: (0, umi_1.publicKey)(VERXIO_LOYALTY_PROGRAM_ID),
                    recipient: (0, umi_1.publicKey)(userWallet),
                    passName: 'ShipXP Pass',
                    updateAuthority: solana_1.umiSigner,
                    organizationName: 'ShipXP',
                });
                console.log(`Issued new loyalty pass to ${userWallet}, tx: ${result.signature}`);
                pass = yield (0, core_1.getAssetData)(solana_1.verxioClient, result.asset.publicKey);
            }
            return pass;
        });
    }
    awardPoints(userWallet, points, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const pass = yield this.issuePassIfNeeded(userWallet);
            if (!pass) {
                throw new Error('Could not issue or find loyalty pass');
            }
            const result = yield (0, core_1.giftLoyaltyPoints)(solana_1.verxioClient, {
                passAddress: (0, umi_1.publicKey)(pass.pass),
                pointsToGift: points,
                signer: solana_1.umiSigner,
                action: reason,
            });
            return { verxioTxId: result.signature, awardedAt: Date.now() };
        });
    }
    revokePoints(userWallet, points) {
        return __awaiter(this, void 0, void 0, function* () {
            const pass = yield this.getPass(userWallet);
            if (!pass) {
                throw new Error('User does not have a loyalty pass');
            }
            const result = yield (0, core_1.revokeLoyaltyPoints)(solana_1.verxioClient, {
                passAddress: (0, umi_1.publicKey)(pass.pass),
                pointsToRevoke: points,
                signer: solana_1.umiSigner,
            });
            return { verxioTxId: result.signature, revokedAt: Date.now() };
        });
    }
    getUserTier(userWallet) {
        return __awaiter(this, void 0, void 0, function* () {
            const pass = yield this.getPass(userWallet);
            if (!pass) {
                return null;
            }
            return pass.currentTier;
        });
    }
}
exports.default = new VerxioClient();
