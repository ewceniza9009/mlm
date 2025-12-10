# Enterprise Upgrade Roadmap

This document outlines the necessary steps to transition the current Binary MLM application from a functional MVP to a secure, scalable, and industry-grade platform.

## 1. Financial Integrity (Critical)
**Goal:** Ensure zero data inconsistency during financial transactions.

*   **Atomic Transactions (ACID)**:
    *   **Problem**: Currently, Wallet, Commission, and PV updates happen independently. A crash mid-process could corrupt user balances.
    *   **Solution**: Wrap `CommissionEngine` logic in **MongoDB Sessions**. Use `session.startTransaction()`, `commitTransaction()`, and `abortTransaction()`.
*   **Race Condition Handling**:
    *   **Problem**: Concurrent bonus triggers could overwrite wallet balances (`balance = balance + amount`).
    *   **Solution**: Use atomic MongoDB operators (e.g., `Wallet.updateOne(..., { $inc: { balance: amount } })`) or enforce **Redis Locking** (Redlock) on specific user records during processing.
*   **Precision Math**:
    *   **Problem**: Floating-point errors (e.g., `0.1 + 0.2 != 0.3`) are unacceptable for finance.
    *   **Solution**: Store all monetary values as **Integers** (cents) or strict strings, handling conversion only at the presentation layer.

## 2. Scalability & Performance
**Goal:** Support 100,000+ users without API timeouts.

*   **Background Job Queues**:
    *   **Problem**: Running commissions for all users synchronously in an API call will time out as the user base grows.
    *   **Solution**: Implement **Redis** + **BullMQ**.
        *   `POST /run-commissions` -> Pushes a job to the queue -> Returns "Job ID: 123".
        *   **Worker Process**: Picks up jobs and processes users in batches (e.g., 100 users per batch).
*   **Database Indexing**:
    *   **Action**: Audit and apply indexes on high-frequency query fields: `sponsorId`, `position`, `path`, and `transaction.date`.

## 3. Security & Compliance
**Goal:** Protect user assets and comply with financial regulations.

*   **Two-Factor Authentication (2FA)**:
    *   **Action**: Integrate TOTP (Google Authenticator) for:
        *   Admin Login.
        *   Withdrawal Requests.
        *   Profile Changes (Password/Bank Info).
*   **KYC (Know Your Customer)**:
    *   **Action**: Add a "Verification" module where users upload ID (Passport/License).
    *   **Logic**: Block withdrawals until KYC status is `VERIFIED`.
*   **Immutable Audit Logs**:
    *   **Action**: Create a `ledger` collection that is **append-only**. Every money movement must have a corresponding ledger entry that can never be deleted or modified, even by admins.

## 4. DevOps & Infrastructure
**Goal:** Consistent deployment and easy scaling.

*   **Dockerization**:
    *   Create `Dockerfile` for Backend and Frontend.
    *   Create `docker-compose.yml` to orchestrate Node, React (Nginx), MongoDB, and Redis.
*   **CI/CD Pipeline**:
    *   Set up GitHub Actions to automatically run tests (`npm test`) on every push.

## 5. Advanced MLM Features
*   **Holding Tank**:
    *   Allow sponsors to manually place new signups into the tree within a grace period (e.g., 24 hours) instead of auto-placement.
*   **Genealogy Search**:
    *   Optimize tree traversal queries for large datasets (e.g., using `Materialized Path` pattern more effectively).
