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
 * @file Guild-related endpoints.
 */
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
/**
 * @api {post} /api/guilds Create a new guild
 * @apiName CreateGuild
 * @apiGroup Guilds
 */
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const db = (0, db_1.initDb)();
        const newGuild = {
            name,
            description,
            pool_xp: 0,
            guild_multiplier: 0.1, // Default multiplier
            createdAt: new Date(),
            memberCount: 0, // Add default member count
            members: [], // Add default members array
        };
        const docRef = yield db.collection('guilds').add(newGuild);
        res.status(201).json(Object.assign({ id: docRef.id }, newGuild));
    }
    catch (error) {
        console.error('Failed to create guild:', error);
        res.status(500).json({ error: 'Failed to create guild' });
    }
}));
/**
 * @api {get} /api/guilds Get all guilds
 * @apiName GetGuilds
 * @apiGroup Guilds
 */
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = (0, db_1.initDb)();
        const guildsSnapshot = yield db.collection('guilds').orderBy('pool_xp', 'desc').get();
        const guilds = guildsSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json(guilds);
    }
    catch (error) {
        console.error('Failed to get guilds:', error);
        res.status(500).json({ error: 'Failed to get guilds' });
    }
}));
/**
 * @api {post} /api/guilds/:id/join Join a guild
 * @apiName JoinGuild
 * @apiGroup Guilds
 */
router.post('/:id/join', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { wallet } = req.body;
    if (!id || !wallet) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const db = (0, db_1.initDb)();
        const guildRef = db.collection('guilds').doc(id);
        const userRef = db.collection('users').doc(wallet);
        yield db.runTransaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            const userDoc = yield transaction.get(userRef);
            if (!userDoc.exists) {
                // Create user if they don't exist
                transaction.set(userRef, { wallet, xp_total: 0, guild_id: id });
            }
            else {
                transaction.update(userRef, { guild_id: id });
            }
        }));
        res.status(200).json({ message: `Successfully joined guild ${id}` });
    }
    catch (error) {
        console.error(`Failed to join guild ${id}:`, error);
        res.status(500).json({ error: 'Failed to join guild' });
    }
}));
/**
 * @api {post} /api/guilds/:id/distribute Distribute guild rewards
 * @apiName DistributeGuildRewards
 * @apiGroup Guilds
 */
router.post('/:id/distribute', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'Missing guild ID' });
    }
    try {
        const db = (0, db_1.initDb)();
        const guildRef = db.collection('guilds').doc(id);
        const guildDoc = yield guildRef.get();
        if (!guildDoc.exists) {
            return res.status(404).json({ error: 'Guild not found' });
        }
        const guild = guildDoc.data(); // Cast to any
        const poolXp = guild.pool_xp;
        if (poolXp <= 0) {
            return res.status(400).json({ error: 'No XP in the pool to distribute' });
        }
        const membersSnapshot = yield db.collection('users').where('guild_id', '==', id).get();
        if (membersSnapshot.empty) {
            return res.status(400).json({ error: 'No members in this guild' });
        }
        const members = membersSnapshot.docs;
        const sharePerMember = Math.floor(poolXp / members.length);
        if (sharePerMember <= 0) {
            return res.status(400).json({ error: 'Not enough XP in the pool to distribute among members' });
        }
        for (const memberDoc of members) {
            const member = memberDoc.data();
            // For now, we'll just add to their total XP.
            // A real implementation would use the Verxio voucher system.
            const newXp = (member.xp_total || 0) + sharePerMember;
            yield db.collection('users').doc(member.wallet).update({ xp_total: newXp });
        }
        yield guildRef.update({ pool_xp: 0 });
        res.status(200).json({
            message: `Successfully distributed ${poolXp} XP among ${members.length} members.`,
            distributed_xp: poolXp,
            member_count: members.length,
        });
    }
    catch (error) {
        console.error(`Error distributing rewards for guild ${id}:`, error);
        res.status(500).json({ error: 'Failed to distribute rewards' });
    }
}));
exports.default = router;
