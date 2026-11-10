# Decisions

Each entry records the decision, why it was made, and when to revisit it. Status is **Accepted**, **Proposed** (Claude's recommendation, waiting on the owner), or **Open**.
ADR-001 to ADR-008 come from the original ChatGPT PRD (§17) and were accepted by the owner on 2026-11-08.

| ID | Decision | Why | Revisit when | Status |
|---|---|---|---|---|
| ADR-001 | Gmail before automated LinkedIn | Gmail has supported messaging APIs; LinkedIn direct DMs are restricted | Formal LinkedIn partner access | Accepted |
| ADR-002 | Outbound Gmail before inbox import | Faster job-search value with a narrower OAuth scope | After outbound works | Accepted; pasted inbound replies come first (ROAST R1) |
| ADR-003 | Human approval before every send | Prevents unwanted or mistaken messages | After evals and explicit opt-in | Accepted |
| ADR-004 | Supabase Postgres + pgvector | One store for relational data, memory and search | Data or scale outgrows the free tier | Accepted |
| ADR-005 | TypeScript Cloudflare Workers backend | Free hosting that fits a TypeScript/React skill set | Long-running or Python-specific needs | Accepted |
| ADR-006 | No agent framework in the first release | A controlled workflow is simpler to test and secure | Orchestration becomes genuinely complex | Accepted |
| ADR-007 | Provider abstraction for LLM calls | Avoid cost and vendor lock-in | Always maintain | Accepted |
| ADR-008 | Manual LinkedIn integration | Protects the account and respects LinkedIn's restrictions | Official messaging access exists | Accepted |
| ADR-009 | Claude Code is the only builder | Owner builds everything in Claude Code; removes multi-agent file ownership | — | Accepted |
| ADR-010 | Messages come in by paste (and Gmail sync later); no screenshot capture | Owner's choice: copy-paste is enough | — | Accepted |
| ADR-011 | LinkedIn support is optional: copy-paste assist only | LinkedIn developer access doesn't allow sending replies | Official messaging access exists | Accepted |
| ADR-012 | Repo keeps ChatGPT's kit as its first commit; `docs/` is the source of truth | History shows how the plan evolved; one place to read | — | Accepted |
| ADR-013 | Default drafting model: a strong hosted model (Claude) behind the adapter, hard $10/month cap; Workers AI stays an option | Draft quality is the product; must beat the ChatGPT ritual (ROAST R3) | Eval set exists (Milestone 4) | Superseded by ADR-019 on 2026-11-10 |
| ADR-014 | npm workspaces, TypeScript packages consumed as source (no per-package build) | No extra tooling to install; Vite, Wrangler and Vitest all compile TS directly | Build times or publishing needs grow | Proposed: builder's call, in use since 2026-11-09 |
| ADR-015 | Hono for routing inside the Worker | Small, Workers-native, typed, easy to test with `app.request()` | — | Proposed: builder's call, in use since 2026-11-09 |
| ADR-016 | Milestone 0 stores data in memory behind an `EchoStore` interface; Supabase arrives in Milestone 1 | A working vertical slice before schema work (ROAST R8); routes won't change | Milestone 1 | Proposed: builder's call, in use since 2026-11-09 |
| ADR-017 | Tailwind v4 tokens + small hand-written shadcn-style primitives | Two components didn't justify the shadcn CLI setup | Component count grows | Proposed: builder's call, in use since 2026-11-09 |
| ADR-018 | A draft containing `[placeholders]` can't be copied or sent | Placeholders mark decisions only the owner can make (availability, salary…) | — | Proposed: builder's call, in use since 2026-11-09 |
| ADR-019 | Default real model: Google Gemini on the free tier (`gemini-3.8-flash`, falling back to `gemini-3.5-flash-lite` when it is overloaded or rate limited; both configurable), called through the Interactions API with `store: false`; the fake model stays the default when no key is set | Owner wants free services for now. Trade-off: on the free tier Google may use prompts to improve its products and human reviewers may read them, so messages and profile facts sent for drafting aren't private from Google | Drafts aren't good enough, free limits get in the way, or privacy matters more than cost (paid tier isn't used for training) | Accepted 2026-11-10 |

## How to add one

Add a row with the next ID, today's date in the PR description, and link the ROAST item if it came from one. Change a status only when the owner has agreed.
