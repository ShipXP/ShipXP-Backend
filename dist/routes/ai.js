"use strict";
"use client";
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
 * @file Routes for AI-related operations.
 */
const express_1 = require("express");
const db_1 = require("../lib/db");
const geminiClient_1 = __importDefault(require("../lib/geminiClient"));
const router = (0, express_1.Router)();
/**
 * @api {post} /api/ai/generate-missions Generate 5 new missions
 * @apiName GenerateMissions
 * @apiGroup AI
 */
router.post("/generate-missions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Received request to generate 5 new missions...");
    try {
        const db = (0, db_1.initDb)();
        const missionPromises = [];
        const difficulties = ["Easy", "Easy", "Medium", "Medium", "Hard"];
        const supportedLanguages = ['javascript', 'rust', 'python', 'anchor-solana', 'go', 'typescript'];
        for (let i = 0; i < 5; i++) {
            const difficulty = difficulties[i];
            const language = supportedLanguages[Math.floor(Math.random() * supportedLanguages.length)];
            missionPromises.push(geminiClient_1.default.generateMission(difficulty, language));
        }
        const generatedMissions = yield Promise.all(missionPromises);
        const createdMissionIds = [];
        for (const mission of generatedMissions) {
            const newMission = Object.assign(Object.assign({}, mission), { type: 'ShipQuest', tags: [mission.difficulty, mission.language], status: "eligible", createdBy: "ShipXP-AI", createdAt: new Date() });
            const docRef = yield db.collection("missions").add(newMission);
            createdMissionIds.push(docRef.id);
        }
        console.log(`Successfully created 5 new missions: ${createdMissionIds.join(", ")}`);
        res.status(201).json({ message: "Successfully created 5 new missions", missionIds: createdMissionIds });
    }
    catch (error) {
        console.error("Failed to generate missions:", error);
        res.status(500).json({ error: "Failed to generate missions" });
    }
}));
exports.default = router;
