# ECHO engineering instructions (for Codex and other coding agents)

## Mission
Build **Echo**, a private, single-user AI communications and job-search assistant, as specified in `ECHO_PRD.md`. Product priority: LinkedIn-assisted recruiting/referral drafts and Gmail-approved sending. Read the PRD before implementation.

## Mandatory constraints
- **Never implement unauthorized LinkedIn scraping, account bots, or automatic LinkedIn DM sending.** LinkedIn messages are user-provided and copy-to-send in MVP.
- **Never send a real email automatically while developing or testing.** Use mocks and fixtures. Real sending must be feature-gated, OAuth-authorized, and user-approved.
- No invented experience, credentials, recruiter identity, email address or job availability.
- Do not place secrets, refresh tokens, resumes, or private messages in logs, commits, fixtures or public PRs.
- Build a **controlled LLM workflow**, not a multi-agent swarm, for the first release.
- Use an `idempotency_key` for provider send actions; approval is for an immutable draft version.
- Do not broaden OAuth scopes without documenting the reason and getting user sign-off.

## Initial scope
Implement **Milestone 0 + Milestone 1 only**: design system, typed contracts, Postgres schema, professional knowledge base, JD/contact intake, outreach drafting, review/copy, job CRM. Gmail outbound comes as an independently gated next milestone.

## Stack
- React + TypeScript + Vite, Tailwind/shadcn-ui.
- TypeScript Cloudflare Workers API.
- Supabase Postgres + pgvector, storage; RLS for user-owned records.
- Provider-independent model adapter, mocked in tests.
- Vitest for unit tests, Playwright for E2E.

## Collaboration conventions
- Work on a **feature branch**; don't edit files owned by another active agent without discussing contracts.
- Use conventional commits and small PRs.
- Add or update API contracts before implementing endpoints and UI integrations.
- Prefer a testable vertical slice over scaffolding every future feature.
- Review `docs/decisions.md` before changing architecture; add a dated ADR for meaningful decisions.
- Run tests, lint and typecheck before proposing a merge.
- If blocked by an account/API/configuration question, implement the mock flow and document what user action is required.

## Suggested ownership (initial parallel work)
- Codex: `packages/contracts`, `packages/core`, `supabase/migrations`, `docs/API_CONTRACTS.md`.
- Claude Code: `apps/web`, user interaction and responsive mock UI.
- Integrator: reviews shared contracts, merges branches and handles real provider credentials.
- ChatGPT: product review, test matrix, acceptance criteria, threat and evaluation reviews.

## Acceptance gate
A task is done only if it maps to a PRD requirement, has documented behavior and error states, uses no real credentials in tests, respects policy boundaries, and includes tests for critical behavior.
