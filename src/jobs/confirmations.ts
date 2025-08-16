/**
 * @file Confirmation job to process pending completions.
 */
import { initDb } from '../lib/db';
import honeycombClient from '../lib/honeycombClient';
import verxioClient from '../lib/verxioClient';

/**
 * Processes pending completions, checks their status, and awards points.
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60 * 1000; // 1 minute

async function processPendingCompletions() {
  console.log('Running confirmation job...');
  const db = initDb();

  const pendingCompletionsSnapshot = await db.collection('completions')
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
      await doc.ref.update({ status: 'failed_after_retries' });
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

        await verxioClient.revokePoints(completion.wallet, Math.abs(xpPenalty));

        await db.runTransaction(async (transaction) => {
          const userRef = db.collection('users').doc(completion.wallet);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists) {
            transaction.set(userRef, { wallet: completion.wallet, xp_total: xpPenalty });
          } else {
            const newXp = (userDoc.data()?.xp_total || 0) + xpPenalty;
            transaction.update(userRef, { xp_total: newXp });
          }

          transaction.update(doc.ref, {
            status: 'failed',
            retryCount: 0,
            lastAttemptedAt: now,
          });
        });
        console.log(`Failed completion ${doc.id} successfully processed and XP deducted.`);
      }
    } catch (error) {
      console.error(`Failed to process completion ${doc.id}:`, error);
      await doc.ref.update({ retryCount: currentRetryCount + 1, lastAttemptedAt: now });
    }
  }
}

/**
 * Starts the confirmation job to run at a specified interval.
 * @param intervalMs The interval in milliseconds to run the job.
 */
export function startConfirmationJob(intervalMs: number) {
  console.log(`Starting confirmation job to run every ${intervalMs / 1000} seconds.`);
  setInterval(processPendingCompletions, intervalMs);
}
