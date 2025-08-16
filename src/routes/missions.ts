import { Router } from 'express';
import { initDb } from '../lib/db';
import codeEvaluator from '../lib/codeEvaluator';
import aiVerifier from '../lib/aiVerifier';
import honeycombClient from '../lib/honeycombClient';
import verxioClient from '../lib/verxioClient';

const router = Router();

/**
 * @api {get} /api/missions Get all missions
 * @apiName GetMissions
 * @apiGroup Missions
 */
router.get('/', async (req, res) => {
  console.log('Backend: Received GET /api/missions request');
  try {
    const db = initDb();
    const missionsQuery = db.collection('missions').orderBy('createdAt', 'desc');
    const missionsSnapshot = await missionsQuery.get();
    const missions = missionsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    res.json(missions);
  } catch (error) {
    console.error('Failed to get missions:', error);
    res.status(500).json({ error: 'Failed to get missions' });
  }
});



/**
 * @api {post} /api/missions/:id/submit Submit code for an AI mission
 * @apiName SubmitCodeForMission
 * @apiGroup Missions
 *
 * @apiParam {String} id Mission ID.
 * @apiBody {String} code User's submitted code.
 * @apiBody {String} walletAddress User's wallet address.
 *
 * @apiSuccess {Boolean} success True if code passed all checks.
 * @apiSuccess {String} reason Reason for failure if success is false.
 */
router.post('/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { code, walletAddress } = req.body;

  if (!code || !walletAddress) {
    return res.status(400).json({ error: 'Missing code or walletAddress' });
  }

  try {
    const db = initDb();
    const missionDoc = await db.collection('missions').doc(id).get();

    if (!missionDoc.exists) {
      return res.status(404).json({ error: 'Mission not found' });
    }
    const mission = missionDoc.data() as any; // Cast to any

    // --- XP Penalty Logic ---
    const xpPenalty = Math.max(5, Math.floor(mission.xpReward * 0.1)); // 10% penalty, min 5

    const handleFailure = async (reason: string, message: string) => {
      console.log(`Submitting failed attempt for mission ${id} for wallet ${walletAddress} for review...`);
      const newCompletionRef = db.collection('completions').doc(); // Get ref beforehand for logging

      const failureLog = {
        wallet: walletAddress,
        missionId: id,
        missionTitle: mission.title,
        xpReward: -xpPenalty, // Log penalty as negative XP
        sourceUrl: 'AI_Submission_Failed',
        status: 'pending_failure_review', // New status for job to pick up
        reason,
        createdAt: new Date(),
      };
      await newCompletionRef.set(failureLog);

      console.log(`Logged failed attempt ${newCompletionRef.id} for user ${walletAddress} with reason: ${reason}. Awaiting job processing.`);
      res.status(200).json({ success: false, reason, message, xpPenalty });
    };

    // 1. Run deterministic tests (mocked)
    const evaluationResult = await codeEvaluator.evaluate(code, mission.testCases || []);
    if (!evaluationResult.testsPassed) {
      return await handleFailure('tests_failed', evaluationResult.output);
    }

    // 2. Run AI verification
    const aiVerificationResult = await aiVerifier.verify(code, id, mission.language);
    if (!aiVerificationResult.aiApproved) {
      return await handleFailure('ai_failed', aiVerificationResult.reason || 'AI did not approve the code.');
    }

    // 3. If both pass, trigger mission completion (via existing claim flow)
    const newCompletion = {
      wallet: walletAddress,
      missionId: id,
      missionTitle: mission.title,
      xpReward: mission.xpReward,
      sourceUrl: 'AI_Submission',
      honeycomb_mission_tx: 'mock-ai-tx-' + Date.now(),
      status: 'pending',
      createdAt: new Date(),
    };

    await db.collection('completions').add(newCompletion);

    res.status(200).json({ success: true, message: 'Code submitted and mission claimed successfully!' });

  } catch (error) {
    console.error('Error submitting code for mission:', error);
    res.status(500).json({ error: 'Failed to submit code for mission' });
  }
});



  router.post('/:id/claim', async (req, res) => {
  const { id } = req.params;
  const { characterId, userWallet } = req.body;

  if (!characterId || !userWallet) {
    return res.status(400).json({ error: 'Missing characterId or userWallet' });
  }

  try {
    const transactions = await honeycombClient.recallCharacterFromMission(id, characterId, userWallet);
    res.json({ transactions });
  } catch (error) {
    console.error('Failed to get claim transaction:', error);
    res.status(500).json({ error: 'Failed to get claim transaction' });
  }
});

router.post('/:id/verify-claim', async (req, res) => {
  const { id } = req.params;
  const { completionId, signature } = req.body;

  if (!completionId || !signature) {
    return res.status(400).json({ error: 'Missing completionId or signature' });
  }

  try {
    const db = initDb();
    const completionDoc = await db.collection('completions').doc(completionId).get();

    if (!completionDoc.exists) {
      return res.status(404).json({ error: 'Completion not found' });
    }

    const completion = completionDoc.data();
    if (!completion) {
      return res.status(404).json({ error: 'Completion data not found' });
    }

    // TODO: Add logic to verify the transaction signature on-chain

    const missionDoc = await db.collection('missions').doc(id).get();
    if (!missionDoc.exists) {
        throw new Error(`Mission ${id} not found!`);
    }
    const mission = missionDoc.data() as any;
    const xpReward = mission.xpReward;

    const verxioRes = await verxioClient.awardPoints(completion.wallet, xpReward, `Mission: ${mission.title}`);

    await db.collection('completions').doc(completionId).update({
      status: 'confirmed',
      verxio_award_tx: verxioRes.verxioTxId,
    });

    // Update user's total XP
    const userRef = db.collection('users').doc(completion.wallet);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        await userRef.set({ wallet: completion.wallet, xp_total: xpReward });
    } else {
        const newXp = (userDoc.data()?.xp_total || 0) + xpReward;
        await userRef.update({ xp_total: newXp });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to verify claim:', error);
    res.status(500).json({ error: 'Failed to verify claim' });
  }
});

export default router;

