# Task 01 — Domain contracts and database (Codex)

**Milestone:** 0–1. **Owned paths:** `packages/contracts`, `packages/core`, `supabase/migrations`, `docs/API_CONTRACTS.md`.

## Deliverables
1. Monorepo structure only where needed by the task.
2. Zod schemas/types for Job, Contact, ProfessionalFact, Document, Draft, DraftVersion, Approval, ActivityEvent and the initial API request/responses.
3. Supabase migration files with RLS policies and indexes.
4. Test seed fixtures using entirely synthetic data.
5. A mock DraftModel interface and deterministic sample generation for tests (no paid or real inference required).
6. A written API contract for Outreach Studio: `POST /api/outreach/generate`, `PATCH /api/drafts/:id`, `POST /api/drafts/:id/approve`, `GET /api/drafts`, `POST /api/jobs`, `POST /api/contacts`.
7. Domain unit tests for status transitions, verified claims and ownership rules.

## Non-goals
No Gmail OAuth, real sending, LinkedIn bot or frontend implementation.

## Acceptance
- Every user-owned table has RLS.
- Invalid inputs are rejected at API boundary.
- Approvals point to a specific immutable draft version.
- A generated draft has a clear `channel` and `delivery_capability`.
- All tests pass locally; migrations are reversible/documented.
