# ShipXP Backend Architecture

This document outlines the architecture and key components of the ShipXP backend.

## 1. Backend Overview

The ShipXP backend serves as the central hub for managing user data, missions, and interactions with blockchain protocols. It provides a robust API layer for the frontend and handles asynchronous processing of on-chain events.

## 2. Technology Stack

*   **Framework:** Node.js with Express.js
*   **Language:** TypeScript
*   **Database:** Google Firestore (NoSQL cloud database)
*   **AI Integration:** Google Gemini API

## 3. API Endpoints

The backend exposes a comprehensive set of RESTful API endpoints:

*   `/api/missions` (GET): Retrieve all ShipQuests.
*   `/api/missions/:id/submit` (POST): Handles code submissions for AI vetting or PR links.
*   `/api/missions/:id/claim` (POST): Initiates the on-chain mission claim process (returns transaction for user signing).
*   `/api/missions/:id/verify-claim` (POST): Verifies signed on-chain claim transactions and awards XP.
*   `/api/ledger` (GET): Fetches a user's mission completion history.
*   `/api/leaderboard` (GET): Provides data for the global user leaderboard.
*   `/api/guilds` (POST, GET): Manages guild creation, joining, and retrieval.
*   `/api/ai/generate-missions` (POST): Triggers the AI to generate new ShipQuests.
*   `/api/admin/data/:collection` (GET): Retrieves all documents from a specified collection for admin viewing.
*   `/api/admin/clear/:collection` (DELETE): Deletes all documents within a specified collection.
*   `/api/admin/delete/:collection/:id` (DELETE): Deletes a specific document by ID from a collection.

## 4. External Integrations

The backend integrates with several external services and blockchain protocols:

*   **Honeycomb Protocol:** Used for on-chain mission status verification and character management. The integration can be switched between a real (Solana devnet) and a mock implementation via the `APPLICATION_STATE` environment variable.
*   **Verxio Protocol:** Used for on-chain XP awarding and management of loyalty passes. The integration can be switched between a real (Solana devnet) and a mock implementation via the `APPLICATION_STATE` environment variable.
*   **Google Gemini API:** Utilized for AI-driven mission generation and code verification. Can be toggled to a mock mode via the `USE_MOCK_GEMINI` environment variable.

## 5. Background Jobs

*   **`confirmations.ts`:** A critical asynchronous job that processes mission outcomes. It handles `pending_failure_review` statuses (deducting XP for failed missions) and can be extended for other reconciliation tasks.

## 6. Communication Flow (Frontend <-> Backend)

Communication primarily occurs via RESTful API calls over HTTP, with data exchanged in JSON format. Mission submissions and claims involve asynchronous processing:

1.  Frontend sends mission submission/claim request to backend.
2.  Backend records initial status (e.g., "pending") in Firestore.
3.  For on-chain claims, backend returns a transaction for the user to sign on the frontend.
4.  Frontend sends the signed transaction to the Solana blockchain.
5.  Frontend notifies backend of the transaction signature.
6.  Backend verifies the on-chain transaction and updates completion status (e.g., "confirmed") and user XP.

## 7. Architecture Diagram (Conceptual)

```
User
  ↓
Frontend (Next.js)
  ↓ (API Calls - REST/JSON)
Backend (Node.js/Express.js)
  ↓
  ├── Google Firestore DB (Firestore SDK)
  ├── Honeycomb Protocol (Solana) (Client)
  ├── Verxio Protocol (Solana) (Client)
  ├── Google Gemini AI (API)
  └── Confirmations Job (confirmations.ts - Background Job)

Frontend (Next.js)
  ↓ (User Wallet Interaction)
Solana Blockchain
  ↓ (Transaction Confirmation)
Backend (Node.js/Express.js)
```

This diagram illustrates the main components and their interactions within the ShipXP backend ecosystem.
