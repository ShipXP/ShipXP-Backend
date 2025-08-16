/**
 * @file Admin-only endpoints for managing data.
 */
import { Router } from 'express';
import { initDb } from '../lib/db';

const router = Router();
const db = initDb();

/**
 * Helper function to delete all documents in a collection.
 * @param {FirebaseFirestore.CollectionReference} collectionRef - The collection to clear.
 * @param {number} batchSize - The number of documents to delete in each batch.
 */
async function deleteCollection(collectionRef: FirebaseFirestore.CollectionReference, batchSize: number) {
  const query = collectionRef.limit(batchSize);
  let snapshot;

  while ((snapshot = await query.get()).size > 0) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

// --- GET (View) Endpoints ---

router.get('/data/:collection', async (req, res) => {
  const { collection } = req.params;
  const allowedCollections = ['missions', 'completions', 'users', 'guilds'];

  if (!allowedCollections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection specified' });
  }

  try {
    const snapshot = await db.collection(collection).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(data);
  } catch (error) {
    console.error(`Failed to fetch ${collection}:`, error);
    res.status(500).json({ error: `Failed to fetch ${collection}` });
  }
});


// --- DELETE (Clear) Endpoints ---

router.delete('/clear/:collection', async (req, res) => {
  const { collection } = req.params;
  const allowedCollections = ['missions', 'completions', 'users', 'guilds'];

  if (!allowedCollections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection specified' });
  }

  try {
    console.log(`Received request to clear collection: ${collection}`);
    const collectionRef = db.collection(collection);
    await deleteCollection(collectionRef, 50); // Using a batch size of 50
    console.log(`Successfully cleared collection: ${collection}`);
    res.status(200).json({ message: `Successfully cleared collection: ${collection}` });
  } catch (error) {
    console.error(`Failed to clear ${collection}:`, error);
    res.status(500).json({ error: `Failed to clear ${collection}` });
  }
});

// --- DELETE (Specific Item) Endpoint ---

router.delete('/delete/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const allowedCollections = ['missions', 'completions', 'users', 'guilds'];

  if (!allowedCollections.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection specified' });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing document ID' });
  }

  try {
    console.log(`Received request to delete document ${id} from collection: ${collection}`);
    await db.collection(collection).doc(id).delete();
    console.log(`Successfully deleted document ${id} from collection: ${collection}`);
    res.status(200).json({ message: `Successfully deleted document ${id} from ${collection}` });
  } catch (error) {
    console.error(`Failed to delete document ${id} from ${collection}:`, error);
    res.status(500).json({ error: `Failed to delete document ${id} from ${collection}` });
  }
});

export default router;
