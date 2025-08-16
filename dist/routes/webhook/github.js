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
/**
 * @file GitHub webhook handler.
 */
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const honeycombClient_1 = __importDefault(require("../../lib/honeycombClient"));
const router = (0, express_1.Router)();
// Middleware to verify GitHub signature
const verifyGitHubSignature = (req, res, next) => {
    const signature = req.headers["x-hub-signature-256"];
    if (!signature) {
        return res.status(401).send("No signature provided.");
    }
    const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
    const hmac = crypto_1.default.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
    try {
        if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
            return res.status(401).send("Invalid signature.");
        }
    }
    catch (error) {
        return res.status(401).send("Invalid signature.");
    }
    next();
};
/**
 * @route POST /api/webhook/github
 * @description Handles GitHub push/PR events.
 */
router.post("/github", verifyGitHubSignature, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const event = req.headers["x-github-event"];
    const payload = req.body;
    console.log(`Received GitHub event: ${event}`);
    try {
        if (event === "pull_request" && payload.action === "closed" && payload.pull_request.merged) {
            const pr = payload.pull_request;
            const repo = payload.repository.full_name;
            const prNumber = pr.number;
            const missionId = `shipxp.pr.merged.${prNumber}`;
            const wallet = req.headers["x-demo-wallet"] || "default-wallet"; // Fallback for now
            const idempotencyKey = `${repo}#${prNumber}#${missionId}`;
            console.log(`Processing merged PR #${prNumber} for mission ${missionId}`);
            const completion = yield honeycombClient_1.default.sendCharacterOnMission(missionId, "default-character", // Placeholder character
            wallet);
            console.log("Mission completion sent to Honeycomb:", completion);
            // Here you would typically save the completion to the database
            // with a 'pending' status.
        }
        res.status(200).send("Webhook received successfully.");
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Error processing webhook.");
    }
}));
exports.default = router;
