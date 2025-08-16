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
exports.startConfirmationJob = startConfirmationJob;
/**
 * @file Confirmation job to process pending completions.
 */
const db_1 = require("../lib/db");
const verxioClient_1 = __importDefault(require("../lib/verxioClient"));
/**
 * Processes pending completions, checks their status, and awards points.
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60 * 1000; // 1 minute
function processPendingCompletions() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Running confirmation job...');
        const db = (0, db_1.initDb)();
        const pendingCompletionsSnapshot = yield db.collection('completions')
            .where('status', 'in', ['pending_failure_review'])
            .get();
        if (pendingCompletionsSnapshot.empty) {
            console.log('No pending completions to process.');
            return;
        }
        const now = new Date();
        for (const doc of pendingCompletionsSnapshot.docs) {
            const completion = doc.data();
            const currentRetryCount = completion.retryCount || 0;
            const lastAttemptedAt = completion.lastAttemptedAt ? completion.lastAttemptedAt.toDate() : new Date(0);
            if (currentRetryCount >= MAX_RETRIES) {
                console.log(`Completion ${doc.id} reached max retries (${MAX_RETRIES}). Marking as failed_after_retries.`);
                yield doc.ref.update({ status: 'failed_after_retries' });
                continue;
            }
            if ((now.getTime() - lastAttemptedAt.getTime()) < RETRY_DELAY_MS) {
                console.log(`Completion ${doc.id} was recently attempted. Skipping for now.`);
                continue;
            }
            console.log(`Processing completion ${doc.id} with status ${completion.status}. Attempt ${currentRetryCount + 1}/${MAX_RETRIES}...`);
            try {
                if (completion.status === 'pending_failure_review') {
                    console.log(`Processing failed mission review for ${doc.id}. Deducting XP.`);
                    const xpPenalty = completion.xpReward; // This will be a negative number
                    yield verxioClient_1.default.revokePoints(completion.wallet, Math.abs(xpPenalty));
                    yield db.runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                        var _a;
                        const userRef = db.collection('users').doc(completion.wallet);
                        const userDoc = yield transaction.get(userRef);
                        if (!userDoc.exists) {
                            transaction.set(userRef, { wallet: completion.wallet, xp_total: xpPenalty });
                        }
                        else {
                            const newXp = (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.xp_total) || 0) + xpPenalty;
                            transaction.update(userRef, { xp_total: newXp });
                        }
                        transaction.update(doc.ref, {
                            status: 'failed',
                            retryCount: 0,
                            lastAttemptedAt: now,
                        });
                    }));
                    console.log(`Failed completion ${doc.id} successfully processed and XP deducted.`);
                }
            }
            catch (error) {
                console.error(`Failed to process completion ${doc.id}:`, error);
                yield doc.ref.update({ retryCount: currentRetryCount + 1, lastAttemptedAt: now });
            }
        }
    });
}
/**
 * Starts the confirmation job to run at a specified interval.
 * @param intervalMs The interval in milliseconds to run the job.
 */
function startConfirmationJob(intervalMs) {
    console.log(`Starting confirmation job to run every ${intervalMs / 1000} seconds.`);
    setInterval(processPendingCompletions, intervalMs);
}
