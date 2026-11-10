# Task 03 — Gmail outbound (after tasks 01–02 merge)

**Milestone:** 2. **Builder:** Claude Code; the owner approves OAuth setup and enabling real sends.

## Deliverables
1. Google OAuth `gmail.send` only at first; secure state/PKCE where appropriate and encrypted refresh token storage.
2. Token revoke/disconnect, permission error flows, provider mocks.
3. New-email compose, MIME formatting, attachment handling and Gmail `users.messages.send` integration.
4. Exact-version human approval, backend policy check and persistent outbox with idempotency key.
5. API and E2E tests for send success/failure, ambiguity/retry, duplicate-click, missing scope, attachment mismatch, stale approval.
6. Feature-flagged real send, enabled only after manual review with a dedicated test account.

## Non-goals
Inbox read, background polling, LinkedIn DM automation, bulk prospecting.

## Acceptance
With a test Google account and reviewed recipient/attachment, exactly one approved Gmail message is sent, and the audit entry stores the provider message ID. No message is considered sent before provider confirmation.
