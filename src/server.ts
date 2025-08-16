import * as dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';

import cors from 'cors';
import { initDb } from './lib/db';
import missionsRouter from './routes/missions';
import ledgerRouter from './routes/ledger';

import githubWebhookRouter from './routes/webhook/github';
import guildsRouter from './routes/guilds';
import aiRouter from './routes/ai';
import leaderboardRouter from './routes/leaderboard';
import adminRouter from './routes/admin';
import { startConfirmationJob } from './jobs/confirmations';
import honeycombClient from './lib/honeycombClient';
import verxioClient from './lib/verxioClient';

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
try {
  initDb();
  
} catch (err) {
  console.error('Failed to initialize services:', err);
  process.exit(1);
}

// Use CORS middleware
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
  res.send('ShipXP Backend is running!');
});

// Mount the API routes
app.use('/api/missions', missionsRouter);
app.use('/api/ledger', ledgerRouter);

app.use('/api/webhook', githubWebhookRouter);
app.use('/api/guilds', guildsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Start the confirmation job
startConfirmationJob(15000); // Run every 15 seconds

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export default app;