# Decisions

Each entry records the decision, why it was made, and when to revisit it. Status is **Accepted**, **Proposed** (Claude's recommendation, waiting on the owner), or **Open**.
ADR-001 to ADR-008 come from the original ChatGPT PRD (§17) and were accepted by the owner on 2026-11-08.

| ID | Decision | Why | Revisit when | Status |
|---|---|---|---|---|
| ADR-001 | Gmail before automated LinkedIn | Gmail has supported messaging APIs; LinkedIn direct DMs are restricted | Formal LinkedIn partner access | Accepted |
| ADR-002 | Outbound Gmail before inbox import | Faster job-search value with a narrower OAuth scope | After outbound works — see ROAST R1 | Accepted, under review |
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
| ADR-013 | Default drafting model | See ROAST R3 | — | Open |

## How to add one

Add a row with the next ID, today's date in the PR description, and link the ROAST item if it came from one. Change a status only when the owner has agreed.
