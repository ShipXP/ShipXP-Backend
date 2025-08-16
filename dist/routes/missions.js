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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const codeEvaluator_1 = __importDefault(require("../lib/codeEvaluator"));
const aiVerifier_1 = __importDefault(require("../lib/aiVerifier"));
const honeycombClient_1 = __importDefault(require("../lib/honeycombClient"));
const verxioClient_1 = __importDefault(require("../lib/verxioClient"));
const router = (0, express_1.Router)();
/**
 * @api {get} /api/missions Get all missions
 * @apiName GetMissions
 * @apiGroup Missions
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Backend: Received GET /api/missions request');
    try {
        const db = (0, db_1.initDb)();
        const missionsQuery = db.collection('missions').orderBy('createdAt', 'desc');
        const missionsSnapshot = yield missionsQuery.get();
        const missions = missionsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json(missions);
    }
    catch (error) {
        console.error('Failed to get missions:', error);
        res.status(500).json({ error: 'Failed to get missions' });
    }
}));
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
router.post('/:id/submit', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { code, walletAddress } = req.body;
    if (!code || !walletAddress) {
        return res.status(400).json({ error: 'Missing code or walletAddress' });
    }
    try {
        const db = (0, db_1.initDb)();
        const missionDoc = yield db.collection('missions').doc(id).get();
        if (!missionDoc.exists) {
            return res.status(404).json({ error: 'Mission not found' });
        }
        const mission = missionDoc.data(); // Cast to any
        // --- XP Penalty Logic ---
        const xpPenalty = Math.max(5, Math.floor(mission.xpReward * 0.1)); // 10% penalty, min 5
        const handleFailure = (reason, message) => __awaiter(void 0, void 0, void 0, function* () {
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
            yield newCompletionRef.set(failureLog);
            console.log(`Logged failed attempt ${newCompletionRef.id} for user ${walletAddress} with reason: ${reason}. Awaiting job processing.`);
            res.status(200).json({ success: false, reason, message, xpPenalty });
        });
        // 1. Run deterministic tests (mocked)
        const evaluationResult = yield codeEvaluator_1.default.evaluate(code, mission.testCases || []);
        if (!evaluationResult.testsPassed) {
            return yield handleFailure('tests_failed', evaluationResult.output);
        }
        // 2. Run AI verification
        const aiVerificationResult = yield aiVerifier_1.default.verify(code, id, mission.language);
        if (!aiVerificationResult.aiApproved) {
            return yield handleFailure('ai_failed', aiVerificationResult.reason || 'AI did not approve the code.');
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
        yield db.collection('completions').add(newCompletion);
        res.status(200).json({ success: true, message: 'Code submitted and mission claimed successfully!' });
    }
    catch (error) {
        console.error('Error submitting code for mission:', error);
        res.status(500).json({ error: 'Failed to submit code for mission' });
    }
}));
router.post('/:id/claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { characterId, userWallet } = req.body;
    if (!characterId || !userWallet) {
        return res.status(400).json({ error: 'Missing characterId or userWallet' });
    }
    try {
        const transactions = yield honeycombClient_1.default.recallCharacterFromMission(id, characterId, userWallet);
        res.json({ transactions });
    }
    catch (error) {
        console.error('Failed to get claim transaction:', error);
        res.status(500).json({ error: 'Failed to get claim transaction' });
    }
}));
router.post('/:id/verify-claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { completionId, signature } = req.body;
    if (!completionId || !signature) {
        return res.status(400).json({ error: 'Missing completionId or signature' });
    }
    try {
        const db = (0, db_1.initDb)();
        const completionDoc = yield db.collection('completions').doc(completionId).get();
        if (!completionDoc.exists) {
            return res.status(404).json({ error: 'Completion not found' });
        }
        const completion = completionDoc.data();
        if (!completion) {
            return res.status(404).json({ error: 'Completion data not found' });
        }
        // TODO: Add logic to verify the transaction signature on-chain
        const missionDoc = yield db.collection('missions').doc(id).get();
        if (!missionDoc.exists) {
            throw new Error(`Mission ${id} not found!`);
        }
        const mission = missionDoc.data();
        const xpReward = mission.xpReward;
        const verxioRes = yield verxioClient_1.default.awardPoints(completion.wallet, xpReward, `Mission: ${mission.title}`);
        yield db.collection('completions').doc(completionId).update({
            status: 'confirmed',
            verxio_award_tx: verxioRes.verxioTxId,
        });
        // Update user's total XP
        const userRef = db.collection('users').doc(completion.wallet);
        const userDoc = yield userRef.get();
        if (!userDoc.exists) {
            yield userRef.set({ wallet: completion.wallet, xp_total: xpReward });
        }
        else {
            const newXp = (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.xp_total) || 0) + xpReward;
            yield userRef.update({ xp_total: newXp });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Failed to verify claim:', error);
        res.status(500).json({ error: 'Failed to verify claim' });
    }
}));
exports.default = router;
