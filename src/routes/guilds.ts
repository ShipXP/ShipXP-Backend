/**
 * @file Guild-related endpoints.
 */
import { Router, Request, Response } from 'express';
import { initDb } from '../lib/db';
import verxioClient from '../lib/verxioClient';

const router = Router();

/**
 * @api {post} /api/guilds Create a new guild
 * @apiName CreateGuild
 * @apiGroup Guilds
 */
router.post('/', async (req: Request, res: Response) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = initDb();
        const newGuild = {
            name,
            description,
            pool_xp: 0,
            guild_multiplier: 0.1, // Default multiplier
            createdAt: new Date(),
            memberCount: 0, // Add default member count
            members: [], // Add default members array
        };
        const docRef = await db.collection('guilds').add(newGuild);
        res.status(201).json({ id: docRef.id, ...newGuild });
    } catch (error) {
        console.error('Failed to create guild:', error);
        res.status(500).json({ error: 'Failed to create guild' });
    }
});

/**
 * @api {get} /api/guilds Get all guilds
 * @apiName GetGuilds
 * @apiGroup Guilds
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const db = initDb();
        const guildsSnapshot = await db.collection('guilds').orderBy('pool_xp', 'desc').get();
        const guilds = guildsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(guilds);
    } catch (error) {
        console.error('Failed to get guilds:', error);
        res.status(500).json({ error: 'Failed to get guilds' });
    }
});

/**
 * @api {post} /api/guilds/:id/join Join a guild
 * @apiName JoinGuild
 * @apiGroup Guilds
 */
router.post('/:id/join', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { wallet } = req.body;

    if (!id || !wallet) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const db = initDb();
        const guildRef = db.collection('guilds').doc(id);
        const userRef = db.collection('users').doc(wallet);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                // Create user if they don't exist
                transaction.set(userRef, { wallet, xp_total: 0, guild_id: id });
            } else {
                transaction.update(userRef, { guild_id: id });
            }
        });

        res.status(200).json({ message: `Successfully joined guild ${id}` });
    } catch (error) {
        console.error(`Failed to join guild ${id}:`, error);
        res.status(500).json({ error: 'Failed to join guild' });
    }
});


/**
 * @api {post} /api/guilds/:id/distribute Distribute guild rewards
 * @apiName DistributeGuildRewards
 * @apiGroup Guilds
 */
router.post('/:id/distribute', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing guild ID' });
  }

  try {
    const db = initDb();
    const guildRef = db.collection('guilds').doc(id);
    const guildDoc = await guildRef.get();

    if (!guildDoc.exists) {
        return res.status(404).json({ error: 'Guild not found' });
    }

    const guild = guildDoc.data() as any; // Cast to any
    const poolXp = guild.pool_xp;

    if (poolXp <= 0) {
        return res.status(400).json({ error: 'No XP in the pool to distribute' });
    }

    const membersSnapshot = await db.collection('users').where('guild_id', '==', id).get();
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
        await db.collection('users').doc(member.wallet).update({ xp_total: newXp });
    }

    await guildRef.update({ pool_xp: 0 });

    res.status(200).json({
      message: `Successfully distributed ${poolXp} XP among ${members.length} members.`,
      distributed_xp: poolXp,
      member_count: members.length,
    });
  } catch (error) {
    console.error(`Error distributing rewards for guild ${id}:`, error);
    res.status(500).json({ error: 'Failed to distribute rewards' });
  }
});

export default router;
