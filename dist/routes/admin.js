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
 * @file Admin-only endpoints for managing data.
 */
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
const db = (0, db_1.initDb)();
/**
 * Helper function to delete all documents in a collection.
 * @param {FirebaseFirestore.CollectionReference} collectionRef - The collection to clear.
 * @param {number} batchSize - The number of documents to delete in each batch.
 */
function deleteCollection(collectionRef, batchSize) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = collectionRef.limit(batchSize);
        let snapshot;
        while ((snapshot = yield query.get()).size > 0) {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            yield batch.commit();
        }
    });
}
// --- GET (View) Endpoints ---
router.get('/data/:collection', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collection } = req.params;
    const allowedCollections = ['missions', 'completions', 'users', 'guilds'];
    if (!allowedCollections.includes(collection)) {
        return res.status(400).json({ error: 'Invalid collection specified' });
    }
    try {
        const snapshot = yield db.collection(collection).get();
        const data = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.status(200).json(data);
    }
    catch (error) {
        console.error(`Failed to fetch ${collection}:`, error);
        res.status(500).json({ error: `Failed to fetch ${collection}` });
    }
}));
// --- DELETE (Clear) Endpoints ---
router.delete('/clear/:collection', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { collection } = req.params;
    const allowedCollections = ['missions', 'completions', 'users', 'guilds'];
    if (!allowedCollections.includes(collection)) {
        return res.status(400).json({ error: 'Invalid collection specified' });
    }
    try {
        console.log(`Received request to clear collection: ${collection}`);
        const collectionRef = db.collection(collection);
        yield deleteCollection(collectionRef, 50); // Using a batch size of 50
        console.log(`Successfully cleared collection: ${collection}`);
        res.status(200).json({ message: `Successfully cleared collection: ${collection}` });
    }
    catch (error) {
        console.error(`Failed to clear ${collection}:`, error);
        res.status(500).json({ error: `Failed to clear ${collection}` });
    }
}));
// --- DELETE (Specific Item) Endpoint ---
router.delete('/delete/:collection/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield db.collection(collection).doc(id).delete();
        console.log(`Successfully deleted document ${id} from collection: ${collection}`);
        res.status(200).json({ message: `Successfully deleted document ${id} from ${collection}` });
    }
    catch (error) {
        console.error(`Failed to delete document ${id} from ${collection}:`, error);
        res.status(500).json({ error: `Failed to delete document ${id} from ${collection}` });
    }
}));
exports.default = router;
