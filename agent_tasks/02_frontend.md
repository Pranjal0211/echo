# Task 02 — Web UX (Claude Code)

**Milestone:** 0–1. **Owned path:** `apps/web`.

## Deliverables
1. Responsive Echo shell/sidebar/header with accessible navigation.
2. Outreach Studio: paste JD, select purpose/contact/resume/tone, generate mocked draft, edit, save, copy.
3. Knowledge Base: editable skills/experience facts, list/upload UI for resumes (mock backend initially).
4. Jobs and contacts screens with seeded data and statuses.
5. Empty-state shells for Inbox, Approvals, Daily Digest and Settings.
6. Distinct Gmail vs LinkedIn actions: `Approve & Send` placeholder disabled when not connected; `Copy for LinkedIn` active.
7. Loading/error/empty states, keyboard navigation, Playwright tests and screenshots.

## Constraints
Use synthetic data; do not add live OAuth or attempt to send real messages. Adopt shared Zod contracts when available. Log any required backend assumptions.

## Acceptance
User can complete a JD-to-draft-to-copy flow in a local browser. All critical buttons work with the mocked state. No LinkedIn automated send control exists. All frontend tests pass.
