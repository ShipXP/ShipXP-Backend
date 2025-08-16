/**
 * @file Tests for the Verxio client.
 */
import verxioClient from '../src/lib/verxioClient';
import { Umi } from '@metaplex-foundation/umi';

describe('VerxioClient', () => {
  beforeAll(() => {
    // We would initialize the client here in a real test
    verxioClient.init({} as Umi, 'mock-program-authority');
  });

  it('should apply idempotency for awardPoints', async () => {
    const idempotencyKey = 'test-idempotency-key';
    const result1 = await verxioClient.awardPoints(
      'test-wallet',
      100,
      'test-reason',
      idempotencyKey
    );
    const result2 = await verxioClient.awardPoints(
      'test-wallet',
      100,
      'test-reason',
      idempotencyKey
    );

    expect(result1.verxioTxId).toBe(result2.verxioTxId);
  });
});
