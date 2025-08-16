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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @file Leaderboard-related endpoints.
 */
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
/**
 * @api {get} /api/leaderboard Get top users by XP
 * @apiName GetLeaderboard
 * @apiGroup Leaderboard
 *
 * @apiSuccess {Object[]} users List of top users with their XP.
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Backend: Received GET /api/leaderboard request');
    try {
        const db = (0, db_1.initDb)();
        const usersSnapshot = yield db.collection('users').orderBy('xp_total', 'desc').limit(10).get(); // Top 10 users
        const leaderboard = usersSnapshot.docs.map(doc => (Object.assign({ walletAddress: doc.id }, doc.data())));
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Failed to get leaderboard:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
}));
exports.default = router;
