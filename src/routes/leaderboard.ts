/**
 * @file Leaderboard-related endpoints.
 */
import { Router } from 'express';
import { initDb } from '../lib/db';

const router = Router();

/**
 * @api {get} /api/leaderboard Get top users by XP
 * @apiName GetLeaderboard
 * @apiGroup Leaderboard
 *
 * @apiSuccess {Object[]} users List of top users with their XP.
 */
router.get('/', async (req, res) => {
  console.log('Backend: Received GET /api/leaderboard request');
  try {
    const db = initDb();
    const usersSnapshot = await db.collection('users').orderBy('xp_total', 'desc').limit(10).get(); // Top 10 users
    const leaderboard = usersSnapshot.docs.map(doc => ({
      walletAddress: doc.id,
      ...doc.data(),
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
