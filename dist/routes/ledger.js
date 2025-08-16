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
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
/**
 * @api {get} /api/ledger?address=:address Get ledger for a wallet
 * @apiName GetLedger
 * @apiGroup Ledger
 *
 * @apiParam {String} address Wallet address.
 *
 * @apiSuccess {Object[]} completions List of completions.
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { address } = req.query;
    if (!address) {
        return res.status(400).json({ error: 'Missing address query parameter' });
    }
    try {
        const db = (0, db_1.initDb)();
        const completionsSnapshot = yield db.collection('completions').where('wallet', '==', address).orderBy('createdAt', 'desc').get();
        const completions = completionsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(completions);
    }
    catch (error) {
        console.error('Failed to get ledger:', error);
        res.status(500).json({ error: 'Failed to get ledger' });
    }
}));
exports.default = router;
