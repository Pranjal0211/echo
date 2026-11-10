# Roast — open review items

A critical review of the ChatGPT-generated plan (round 2, after the owner's decisions on 2026-11-08).
The plan, stack and guardrails stay. What's left is a list of improvements, worked through **one at a time** in `GRILL.md`.

> **2026-11-09:** the owner accepted every recommendation below. `GRILL.md` tracks what is built and what is still to come.

## Settled

| Item | Outcome |
|---|---|
| Screenshot capture | Dropped. Paste the message instead (ADR-010) |
| Tech stack (React/Vite + Cloudflare Workers + Supabase) | Kept as is |
| Codex / ChatGPT / integrator split | Replaced: Claude Code builds everything (ADR-009) |
| LinkedIn | Optional copy-paste assist; no automation, ever (ADR-008, ADR-011) |
| Sending from Echo | Kept: Echo sends Gmail after you approve (outbox + idempotency stay) |
| One giant document | PRD stays; architecture, decisions and review now have their own files |
| Kit manifest instead of a README | Replaced with a real README |

## Open items (highest impact first)

### R1 — Your daily workflow arrives in Milestone 3
**Problem:** What you described ("messages show up in the dashboard with a reply drafted; I approve and send") is Gmail inbox reading, which is **Milestone 3**. Milestone 1 is Outreach Studio (writing *new* referral/recruiter messages from a job description). For the first two milestones, Echo can't help with a message someone sent you.
**Options:**
- (a) Keep the order exactly.
- (b) Keep the order, but let Milestone 1 also **reply to a pasted message** (same drafting engine, no OAuth). The PRD already allows "manually imported external messages" in the Inbox.
- (c) Swap Milestones 2 and 3 so Gmail reading comes before Gmail sending.
**Recommendation:** (b). Tiny addition, no new infrastructure, and from Milestone 1 Echo replaces the copy-into-ChatGPT step for LinkedIn and Gmail.

### R2 — "Replying late" has no feature until Milestone 5
**Problem:** Lateness is half your pain, but "who is waiting on me, and for how long" only arrives with the digest and reminders (P1, Milestone 5).
**Recommendation:** In Milestone 1, give every conversation a *waiting on me / waiting on them* status and a "since" date, show an age badge ("3d") in the Inbox, and sort by oldest-waiting by default. It's a field and a sort, not a new system.

### R3 — The default model may lose to ChatGPT
**Problem:** The PRD defaults to a free open-weight model on Workers AI. If drafts are worse than what ChatGPT gives you today, you'll go back to ChatGPT, and the rest of Echo won't matter.
**Recommendation:** Keep the adapter (ADR-007) and keep Workers AI as an option, but default drafting to a strong hosted model (e.g. Claude) with a hard monthly spend cap in Settings. Compare models later with the eval set. Stack unchanged; this is only which model the adapter calls.

### R4 — The "twin" learns your voice last
**Problem:** Style learning and RAG are Milestone 4, so early drafts will sound generic. The mockup drafts already read like recruiter-speak.
**Recommendation:** From Milestone 1, put your style preferences and 5–10 approved example messages (already part of the Knowledge Base, FR-02) straight into the prompt. Save every edited-and-sent version from day one so Milestone 4 has data.

### R5 — Metrics have no targets
**Problem:** Most success metrics say "collect baseline", so there's no line that says "it works".
**Recommendation:** Add targets:
- Threads waiting on you over 48h: **0 on most days**
- Median reply time to recruiters: **under 24h**
- Opening a message to having a draft ready: **under 60s**
- Drafts sent with only light edits: **70%+**

### R6 — The mockups promise things the PRD forbids
**Problem:**
- LinkedIn rows show **Approve & Send**.
- Slack and Teams rows appear on the main screen.
- "Confidence: High" and "Matched (92%)" are made-up numbers.
- The autonomy toggle sits on the digest page.
- No "waiting N days" anywhere.

**Recommendation:** Keep the visual style. When building the UI:
- LinkedIn rows get **Copy** and **Mark as sent**.
- No Slack or Teams rows until they exist.
- Replace confidence scores with "facts used" and warnings.
- Move autonomy to Settings, disabled.
- Add age badges.

### R7 — FR-06 says P0, the scope says later
**Problem:** "Gmail sending" is marked P0, but the first scope (Milestones 0–1) excludes it.
**Recommendation:** Label it "P0 — Milestone 2" so nobody builds it early.

### R8 — Milestone 0 is heavy before anything works
**Problem:** Four packages, RLS on 14 tables, migrations and contracts for every entity, all before the first draft appears.
**Recommendation:** Same structure, but create each package and table only when the first feature needs it. Milestone 0 ends with one working path (paste → draft → copy) on fake data.

### R9 — Gmail's personal-app reality
**Problem:** Gmail reading (`gmail.readonly`) is a restricted scope. A personal app left in Google's "testing" mode (you as the only test user) avoids Google's verification review, but sign-in tokens expire about every 7 days. Sending (`gmail.send`) is a sensitive scope with the same testing-mode limit.
**Recommendation:** Accept a weekly "reconnect Gmail" for personal use, and show the connection status clearly. Re-check Google's current rules when building Milestone 2.

### R10 — Tool, portfolio, or product?
**Problem:** The PRD wants Echo to "demonstrate" RAG, OAuth, evals, MCP and more. That pushes toward building features to show off rather than features you use.
**Recommendation:** Tool first. A tool you use every day, with real metrics, is the stronger portfolio piece.

### R11 — LinkedIn copy assist: P0 or later?
**Problem:** FR-05 (copy for LinkedIn, mark as sent manually) is P0, and you said LinkedIn is optional.
**Recommendation:** Keep it in Milestone 1. It's about a day of work, and with R1(b) it covers your LinkedIn replies by paste.

## What ChatGPT got right (keep)

- Every send needs your approval.
- No LinkedIn bots or scraping.
- No invented facts.
- Salary and availability are always your call.
- Message text is treated as data, never as instructions.
- Exact-version approvals and idempotent sends.
- Fake providers in tests.
- A swappable model adapter.
