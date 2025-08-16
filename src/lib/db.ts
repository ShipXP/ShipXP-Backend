/**
 * @file Firebase Admin SDK initialization.
 */
import * as admin from 'firebase-admin';

// The user has confirmed this file exists and is in the correct location.
const serviceAccount = require('../../serviceAccountKey.json');

let db: admin.firestore.Firestore;

/**
 * Initializes the Firebase Admin SDK and Firestore.
 * Ensures that initialization only happens once.
 */
export function initDb() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'shipxp-54f9a',
    });
    console.log('Firebase Admin SDK initialized.');
    db = admin.firestore();
  }
  return db;
}
