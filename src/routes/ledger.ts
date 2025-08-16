import { Router, Request, Response } from 'express';
import { initDb } from '../lib/db';

const router = Router();

/**
 * @api {get} /api/ledger?address=:address Get ledger for a wallet
 * @apiName GetLedger
 * @apiGroup Ledger
 *
 * @apiParam {String} address Wallet address.
 *
 * @apiSuccess {Object[]} completions List of completions.
 */
router.get('/', async (req: Request, res: Response) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter' });
  }

  try {
    const db = initDb();
    const completionsSnapshot = await db.collection('completions').where('wallet', '==', address).orderBy('createdAt', 'desc').get();
    const completions = completionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(completions);
  } catch (error) {
    console.error('Failed to get ledger:', error);
    res.status(500).json({ error: 'Failed to get ledger' });
  }
});

export default router;

