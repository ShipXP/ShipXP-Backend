
import { verxioClient, umiSigner } from './solana';
import { issueLoyaltyPass, giftLoyaltyPoints, revokeLoyaltyPoints, getAssetData } from '@verxioprotocol/core';
import { publicKey } from '@metaplex-foundation/umi';


const VERXIO_LOYALTY_PROGRAM_ID = process.env.VERXIO_LOYALTY_PROGRAM_ID;

class VerxioClient {

  constructor() {
    if (!VERXIO_LOYALTY_PROGRAM_ID) {
      throw new Error('Missing Verxio environment variables');
    }
  }

  private async getPass(userWallet: string) {
    try {
        const assetData = await getAssetData(verxioClient, publicKey(userWallet));
        return assetData;
    } catch (e) {
        return null;
    }
  }

  public async issuePassIfNeeded(userWallet: string) {
    let pass = await this.getPass(userWallet);
    if (!pass) {
      const result = await issueLoyaltyPass(verxioClient, {
        collectionAddress: publicKey(VERXIO_LOYALTY_PROGRAM_ID!),
        recipient: publicKey(userWallet),
        passName: 'ShipXP Pass',
        updateAuthority: umiSigner,
        organizationName: 'ShipXP',
      });
      console.log(`Issued new loyalty pass to ${userWallet}, tx: ${result.signature}`);
      pass = await getAssetData(verxioClient, result.asset.publicKey);
    }
    return pass;
  }

  public async awardPoints(userWallet: string, points: number, reason: string) {
    const pass = await this.issuePassIfNeeded(userWallet);
    if (!pass) {
      throw new Error('Could not issue or find loyalty pass');
    }
    const result = await giftLoyaltyPoints(verxioClient, {
      passAddress: publicKey(pass.pass),
      pointsToGift: points,
      signer: umiSigner,
      action: reason,
    });
    return { verxioTxId: result.signature, awardedAt: Date.now() };
  }

  public async revokePoints(userWallet: string, points: number) {
    const pass = await this.getPass(userWallet);
    if (!pass) {
      throw new Error('User does not have a loyalty pass');
    }
    const result = await revokeLoyaltyPoints(verxioClient, {
      passAddress: publicKey(pass.pass),
      pointsToRevoke: points,
      signer: umiSigner,
    });
    return { verxioTxId: result.signature, revokedAt: Date.now() };
  }

  public async getUserTier(userWallet: string) {
    const pass = await this.getPass(userWallet);
    if (!pass) {
      return null;
    }
    return pass.currentTier;
  }
}

export default new VerxioClient();
