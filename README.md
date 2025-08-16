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

```mermaid
graph TD
    User -->|Frontend (Next.js)| Frontend
    Frontend -->|API Calls (REST/JSON)| Backend

    subgraph Backend (Node.js/Express.js)
        Backend -->|Firestore SDK| Google_Firestore[Google Firestore DB]
        Backend -->|Honeycomb Client| Honeycomb_Protocol[Honeycomb Protocol (Solana)]
        Backend -->|Verxio Client| Verxio_Protocol[Verxio Protocol (Solana)]
        Backend -->|Gemini API| Google_Gemini[Google Gemini AI]
        Backend --o|Background Job| Confirmations_Job[confirmations.ts]
    end

    Honeycomb_Protocol --o|On-chain Events| Confirmations_Job
    Verxio_Protocol --o|On-chain Events| Confirmations_Job

    Frontend --o|User Wallet Interaction| Solana_Blockchain[Solana Blockchain]
    Solana_Blockchain --o|Transaction Confirmation| Backend

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
    style Google_Firestore fill:#ccf,stroke:#333,stroke-width:2px
    style Honeycomb_Protocol fill:#cfc,stroke:#333,stroke-width:2px
    style Verxio_Protocol fill:#cff,stroke:#333,stroke-width:2px
    style Google_Gemini fill:#ffc,stroke:#333,stroke-width:2px
    style Confirmations_Job fill:#fcc,stroke:#333,stroke-width:2px
    style Solana_Blockchain fill:#fcf,stroke:#333,stroke-width:2px
```

This diagram illustrates the main components and their interactions within the ShipXP backend ecosystem.