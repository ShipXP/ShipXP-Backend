/**
 * @file GitHub webhook handler.
 */
import { Request, Response, Router } from "express";
import crypto from "crypto";
import honeycombClient from "../../lib/honeycombClient";

const router = Router();

// Middleware to verify GitHub signature
const verifyGitHubSignature = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature) {
    return res.status(401).send("No signature provided.");
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      return res.status(401).send("Invalid signature.");
    }
  } catch (error) {
    return res.status(401).send("Invalid signature.");
  }

  next();
};

/**
 * @route POST /api/webhook/github
 * @description Handles GitHub push/PR events.
 */
router.post("/github", verifyGitHubSignature, async (req: Request, res: Response) => {
  const event = req.headers["x-github-event"] as string;
  const payload = req.body;

  console.log(`Received GitHub event: ${event}`);

  try {
    if (event === "pull_request" && payload.action === "closed" && payload.pull_request.merged) {
      const pr = payload.pull_request;
      const repo = payload.repository.full_name;
      const prNumber = pr.number;
      const missionId = `shipxp.pr.merged.${prNumber}`;
      const wallet = req.headers["x-demo-wallet"] as string || "default-wallet"; // Fallback for now

      const idempotencyKey = `${repo}#${prNumber}#${missionId}`;

      console.log(`Processing merged PR #${prNumber} for mission ${missionId}`);

      const completion = await honeycombClient.sendCharacterOnMission(
        missionId,
        "default-character", // Placeholder character
        wallet
      );

      console.log("Mission completion sent to Honeycomb:", completion);

      // Here you would typically save the completion to the database
      // with a 'pending' status.
    }

    res.status(200).send("Webhook received successfully.");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing webhook.");
  }
});

export default router;